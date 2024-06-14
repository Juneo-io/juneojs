import { type Blockchain } from '../chain'
import { JuneoBuffer, type Serializable } from '../utils'
import { BlockchainIdSize, CodecId } from './constants'
import { TransferableInput } from './input'
import { TransferableOutput, type Utxo } from './output'
import { SignableTx, type Signable, type Signer } from './signature'
import { type BlockchainId } from './types'

export class TransactionFee {
  chain: Blockchain
  amount: bigint
  assetId: string

  constructor (chain: Blockchain, amount: bigint) {
    this.chain = chain
    this.amount = amount
    this.assetId = chain.assetId
  }
}

export interface TransactionStatusFetcher {
  fetch: (timeout: number, delay: number) => Promise<string>
}

export interface UnsignedTransaction extends Serializable {
  codecId: number
  typeId: number
  networkId: number
  blockchainId: BlockchainId
  outputs: TransferableOutput[]
  inputs: TransferableInput[]
  memo: string
  getSignables: () => Signable[]
  getUtxos: () => Utxo[]
  signTransaction: (signers: Signer[]) => Promise<JuneoBuffer>
}

export abstract class AbstractBaseTransaction extends SignableTx implements UnsignedTransaction {
  codecId: number
  typeId: number
  networkId: number
  blockchainId: BlockchainId
  outputs: TransferableOutput[]
  inputs: TransferableInput[]
  memo: string

  constructor (
    typeId: number,
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string
  ) {
    super()
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

  abstract getSignables (): Signable[]

  getUtxos (): Utxo[] {
    const utxos: Utxo[] = []
    for (const transferable of this.inputs) {
      // should be Utxo here because transaction should be from builder
      // undefined should only be the case if it is an input from parsing bytes
      utxos.push(transferable.input.utxo!)
    }
    return utxos
  }

  async signTransaction (signers: Signer[]): Promise<JuneoBuffer> {
    return await super.sign(this.serialize(), this.getSignables(), signers)
  }

  serialize (): JuneoBuffer {
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize: number = 0
    for (const output of this.outputs) {
      const bytes: JuneoBuffer = output.serialize()
      outputsSize += bytes.length
      outputsBytes.push(bytes)
    }
    const inputsBytes: JuneoBuffer[] = []
    let inputsSize: number = 0
    for (const input of this.inputs) {
      const bytes: JuneoBuffer = input.serialize()
      inputsSize += bytes.length
      inputsBytes.push(bytes)
    }
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 2 + 4 + 4 + 4 + 4 + 4 = 22
      22 + BlockchainIdSize + outputsSize + inputsSize + this.memo.length
    )
    buffer.writeUInt16(this.codecId)
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.networkId)
    buffer.write(this.blockchainId.serialize())
    buffer.writeUInt32(this.outputs.length)
    for (const output of outputsBytes) {
      buffer.write(output)
    }
    buffer.writeUInt32(this.inputs.length)
    for (const input of inputsBytes) {
      buffer.write(input)
    }
    // since Durango upgrade memo cannot be used anymore
    // force it here to be empty to avoid issues with builders already used with memos
    buffer.writeUInt32(0) // 0 instead of this.memo.length
    buffer.writeString('') // '' instead of this.memo
    return buffer
  }
}

export class AbstractExportTransaction extends AbstractBaseTransaction {
  destinationChain: BlockchainId
  exportedOutputs: TransferableOutput[]

  constructor (
    typeId: number,
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    destinationChain: BlockchainId,
    exportedOutputs: TransferableOutput[]
  ) {
    super(typeId, networkId, blockchainId, outputs, inputs, memo)
    this.destinationChain = destinationChain
    this.exportedOutputs = exportedOutputs
    this.exportedOutputs.sort(TransferableOutput.comparator)
  }

  getSignables (): Signable[] {
    return this.inputs
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const exportedOutputsBytes: JuneoBuffer[] = []
    let exportedOutputsSize: number = 0
    for (const output of this.exportedOutputs) {
      const bytes: JuneoBuffer = output.serialize()
      exportedOutputsSize += bytes.length
      exportedOutputsBytes.push(bytes)
    }
    const buffer: JuneoBuffer = JuneoBuffer.alloc(baseTransaction.length + BlockchainIdSize + 4 + exportedOutputsSize)
    buffer.write(baseTransaction)
    buffer.write(this.destinationChain.serialize())
    buffer.writeUInt32(this.exportedOutputs.length)
    for (const output of exportedOutputsBytes) {
      buffer.write(output)
    }
    return buffer
  }
}

export class AbstractImportTransaction extends AbstractBaseTransaction {
  sourceChain: BlockchainId
  importedInputs: TransferableInput[]

  constructor (
    typeId: number,
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    sourceChain: BlockchainId,
    importedInputs: TransferableInput[]
  ) {
    super(typeId, networkId, blockchainId, outputs, inputs, memo)
    this.sourceChain = sourceChain
    this.importedInputs = importedInputs
    this.importedInputs.sort(TransferableInput.comparator)
  }

  getSignables (): Signable[] {
    return this.inputs.concat(this.importedInputs)
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const importedInputsBytes: JuneoBuffer[] = []
    let importedInputsSize: number = 0
    for (const input of this.importedInputs) {
      const bytes: JuneoBuffer = input.serialize()
      importedInputsSize += bytes.length
      importedInputsBytes.push(bytes)
    }
    const buffer: JuneoBuffer = JuneoBuffer.alloc(baseTransaction.length + BlockchainIdSize + 4 + importedInputsSize)
    buffer.write(baseTransaction)
    buffer.write(this.sourceChain.serialize())
    buffer.writeUInt32(this.importedInputs.length)
    for (const input of importedInputsBytes) {
      buffer.write(input)
    }
    return buffer
  }
}
