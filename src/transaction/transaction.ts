import { JuneoBuffer, sha256, type Serializable, TransactionError } from '../utils'
import { type VMWallet } from '../wallet/wallet'
import { TransferableInput } from './input'
import { TransferableOutput } from './output'
import { Secp256k1Credentials } from './signature'
import { type BlockchainId, BlockchainIdSize, Signature, type Address } from './types'

export const CodecId: number = 0

export interface UnsignedTransaction {
  codecId: number
  typeId: number
  networkId: number
  blockchainId: BlockchainId
  outputs: TransferableOutput[]
  inputs: TransferableInput[]
  memo: string
  sign: (wallets: VMWallet[]) => JuneoBuffer
  getUnsignedInputs: () => TransferableInput[]
}

export abstract class AbstractBaseTransaction implements UnsignedTransaction, Serializable {
  codecId: number
  typeId: number
  networkId: number
  blockchainId: BlockchainId
  outputs: TransferableOutput[]
  inputs: TransferableInput[]
  memo: string

  constructor (typeId: number, networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string) {
    this.codecId = CodecId
    this.typeId = typeId
    this.networkId = networkId
    this.blockchainId = blockchainId
    this.outputs = outputs
    this.outputs.sort(TransferableOutput.comparator)
    this.inputs = inputs
    this.inputs.sort(TransferableInput.comparator)
    this.memo = memo
  }

  abstract getUnsignedInputs (): TransferableInput[]

  sign (wallets: VMWallet[]): JuneoBuffer {
    const bytes: JuneoBuffer = this.serialize()
    const credentials: JuneoBuffer[] = []
    let credentialsSize: number = 0
    this.getUnsignedInputs().forEach(input => {
      if (input.input.utxo === undefined) {
        throw new TransactionError('cannot sign transcations containing invalid utxos as inputs')
      }
      const indices: number[] = input.input.addressIndices
      const signatures: Signature[] = []
      const threshold: number = input.input.utxo.output.threshold
      for (let i = 0; i < threshold && i < indices.length; i++) {
        const address: Address = input.input.utxo.output.addresses[i]
        for (let j = 0; j < wallets.length; j++) {
          const wallet: VMWallet = wallets[j]
          if (address.matches(wallet.getAddress())) {
            signatures.push(new Signature(wallet.sign(sha256(bytes))))
            break
          }
        }
      }
      const credential: JuneoBuffer = new Secp256k1Credentials(signatures).serialize()
      credentialsSize += credential.length
      credentials.push(credential)
    })
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      bytes.length + 4 + credentialsSize
    )
    buffer.write(bytes)
    buffer.writeUInt32(credentials.length)
    credentials.forEach(credential => {
      buffer.write(credential)
    })
    return buffer
  }

  serialize (): JuneoBuffer {
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize: number = 0
    this.outputs.forEach(output => {
      const bytes: JuneoBuffer = output.serialize()
      outputsSize += bytes.length
      outputsBytes.push(bytes)
    })
    const inputsBytes: JuneoBuffer[] = []
    let inputsSize: number = 0
    this.inputs.forEach(input => {
      const bytes: JuneoBuffer = input.serialize()
      inputsSize += bytes.length
      inputsBytes.push(bytes)
    })
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 2 + 4 + 4 + 4 + 4 + 4 = 22
      22 + BlockchainIdSize + outputsSize + inputsSize + this.memo.length
    )
    buffer.writeUInt16(this.codecId)
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.networkId)
    buffer.write(this.blockchainId.serialize())
    buffer.writeUInt32(this.outputs.length)
    outputsBytes.forEach(output => {
      buffer.write(output)
    })
    buffer.writeUInt32(this.inputs.length)
    inputsBytes.forEach(input => {
      buffer.write(input)
    })
    buffer.writeUInt32(this.memo.length)
    buffer.writeString(this.memo)
    return buffer
  }
}

export class AbstractExportTransaction extends AbstractBaseTransaction {
  destinationChain: BlockchainId
  exportedOutputs: TransferableOutput[]

  constructor (typeId: number, networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    destinationChain: BlockchainId, exportedOutputs: TransferableOutput[]) {
    super(typeId, networkId, blockchainId, outputs, inputs, memo)
    this.destinationChain = destinationChain
    this.exportedOutputs = exportedOutputs
    this.exportedOutputs.sort(TransferableOutput.comparator)
  }

  getUnsignedInputs (): TransferableInput[] {
    return this.inputs
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const exportedOutputsBytes: JuneoBuffer[] = []
    let exportedOutputsSize: number = 0
    this.exportedOutputs.forEach(output => {
      const bytes: JuneoBuffer = output.serialize()
      exportedOutputsSize += bytes.length
      exportedOutputsBytes.push(bytes)
    })
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length + BlockchainIdSize + 4 + exportedOutputsSize
    )
    buffer.write(baseTransaction)
    buffer.write(this.destinationChain.serialize())
    buffer.writeUInt32(this.exportedOutputs.length)
    exportedOutputsBytes.forEach(output => {
      buffer.write(output)
    })
    return buffer
  }
}

export class AbstractImportTransaction extends AbstractBaseTransaction {
  sourceChain: BlockchainId
  importedInputs: TransferableInput[]

  constructor (typeId: number, networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    sourceChain: BlockchainId, importedInputs: TransferableInput[]) {
    super(typeId, networkId, blockchainId, outputs, inputs, memo)
    this.sourceChain = sourceChain
    this.importedInputs = importedInputs
    this.importedInputs.sort(TransferableInput.comparator)
  }

  getUnsignedInputs (): TransferableInput[] {
    return this.inputs.concat(this.importedInputs)
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const importedInputsBytes: JuneoBuffer[] = []
    let importedInputsSize: number = 0
    this.importedInputs.forEach(input => {
      const bytes: JuneoBuffer = input.serialize()
      importedInputsSize += bytes.length
      importedInputsBytes.push(bytes)
    })
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length + BlockchainIdSize + 4 + importedInputsSize
    )
    buffer.write(baseTransaction)
    buffer.write(this.sourceChain.serialize())
    buffer.writeUInt32(this.importedInputs.length)
    importedInputsBytes.forEach(input => {
      buffer.write(input)
    })
    return buffer
  }
}
