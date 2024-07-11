import { type Blockchain } from '../chain'
import { JuneoBuffer, SignatureError, TransactionError, type Serializable } from '../utils'
import { BlockchainIdSize, CodecId } from './constants'
import { TransferableInput } from './input'
import { TransferableOutput, type Utxo } from './output'
import { Secp256k1Credentials, type Signable, type Signer } from './signature'
import { BlockchainId, type Signature } from './types'

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
  getInputs: () => TransferableInput[]
  getOutputs: () => TransferableOutput[]
  getOutput: (index: number) => TransferableOutput
  getUtxos: () => Utxo[]
  sign: (signers: Signer[]) => Promise<Signature[]>
  signTransaction: (signers: Signer[]) => Promise<string>
}

export class BaseTransaction implements UnsignedTransaction {
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

  getSignables (): Signable[] {
    return this.inputs
  }

  getInputs (): TransferableInput[] {
    return this.inputs
  }

  getOutputs (): TransferableOutput[] {
    return this.outputs
  }

  getOutput (index: number): TransferableOutput {
    const outputs = this.getOutputs()
    if (index >= outputs.length) {
      throw new TransactionError(`transaction does not have output at index ${index} > length (${outputs.length})`)
    }
    return outputs[index]
  }

  getUtxos (): Utxo[] {
    const utxos: Utxo[] = []
    for (const transferable of this.inputs) {
      // should be Utxo here because transaction should be from builder
      // undefined should only be the case if it is an input from parsing bytes
      utxos.push(transferable.input.utxo!)
    }
    return utxos
  }

  async sign (signers: Signer[]): Promise<Signature[]> {
    const bytes = this.serialize()
    const signed = new Set<string>()
    const signatures: Signature[] = []
    for (const signable of this.getSignables()) {
      for (const signature of await signable.sign(bytes, signers)) {
        const key = signature.recoverAddress(bytes).serialize().toHex()
        if (signed.has(key)) {
          continue
        }
        signed.add(key)
        signatures.push(signature)
      }
    }
    return signatures
  }

  async signTransaction (signers: Signer[]): Promise<string> {
    const bytes = this.serialize()
    const credentials: JuneoBuffer[] = []
    let credentialsSize = 0
    for (const signable of this.getSignables()) {
      const signatures = await signable.sign(bytes, signers)
      if (signatures.length < signable.getThreshold()) {
        throw new SignatureError('missing signer to complete signatures')
      }
      const creds = new Secp256k1Credentials(signatures)
      const credentialBytes = creds.serialize()
      credentialsSize += credentialBytes.length
      credentials.push(credentialBytes)
    }
    const buffer = JuneoBuffer.alloc(bytes.length + 4 + credentialsSize)
    buffer.write(bytes)
    buffer.writeUInt32(credentials.length)
    for (const credential of credentials) {
      buffer.write(credential)
    }
    return buffer.toCHex()
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

  static parse (data: string | JuneoBuffer, expectedTypeId: number): BaseTransaction {
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    // skip codec reading
    reader.skip(2)
    const typeId = reader.readAndVerifyTypeId(expectedTypeId)
    const networkId = reader.readUInt32()
    const blockchainId = new BlockchainId(reader.read(BlockchainIdSize).toCB58())
    const outputsLength = reader.readUInt32()
    const outputs: TransferableOutput[] = []
    for (let i = 0; i < outputsLength; i++) {
      const output = TransferableOutput.parse(reader.peekRemaining())
      reader.skip(output)
      outputs.push(output)
    }
    const inputsLength = reader.readUInt32()
    const inputs: TransferableInput[] = []
    for (let i = 0; i < inputsLength; i++) {
      const input = TransferableInput.parse(reader.peekRemaining())
      reader.skip(input)
      inputs.push(input)
    }
    const memoLength = reader.readUInt32()
    const memo = memoLength > 0 ? reader.readString(memoLength) : ''
    return new BaseTransaction(typeId, networkId, blockchainId, outputs, inputs, memo)
  }
}

export class ExportTransaction extends BaseTransaction {
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

  getOutputs (): TransferableOutput[] {
    return [...this.outputs, ...this.exportedOutputs]
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

  static parse (data: string | JuneoBuffer, expectedTypeId: number): ExportTransaction {
    const baseTx = BaseTransaction.parse(data, expectedTypeId)
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    reader.skip(baseTx)
    const destinationChain = new BlockchainId(reader.read(BlockchainIdSize).toCB58())
    const exportedOutputsLength = reader.readUInt32()
    const exportedoutputs: TransferableOutput[] = []
    for (let i = 0; i < exportedOutputsLength; i++) {
      const output = TransferableOutput.parse(reader.peekRemaining())
      reader.skip(output)
      exportedoutputs.push(output)
    }
    return new ExportTransaction(
      baseTx.typeId,
      baseTx.networkId,
      baseTx.blockchainId,
      baseTx.outputs,
      baseTx.inputs,
      baseTx.memo,
      destinationChain,
      exportedoutputs
    )
  }
}

export class ImportTransaction extends BaseTransaction {
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

  getInputs (): TransferableInput[] {
    return [...this.inputs, ...this.importedInputs]
  }

  getSignables (): Signable[] {
    return [...this.inputs, ...this.importedInputs]
  }

  getUtxos (): Utxo[] {
    const utxos = super.getUtxos()
    for (const transferable of this.importedInputs) {
      // should be Utxo here because transaction should be from builder
      // undefined should only be the case if it is an input from parsing bytes
      utxos.push(transferable.input.utxo!)
    }
    return utxos
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

  static parse (data: string | JuneoBuffer, expectedTypeId: number): ImportTransaction {
    const baseTx = BaseTransaction.parse(data, expectedTypeId)
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    reader.skip(baseTx)
    const sourceChain = new BlockchainId(reader.read(BlockchainIdSize).toCB58())
    const importedInputsLength = reader.readUInt32()
    const importedInputs: TransferableInput[] = []
    for (let i = 0; i < importedInputsLength; i++) {
      const input = TransferableInput.parse(reader.peekRemaining())
      reader.skip(input)
      importedInputs.push(input)
    }
    return new ImportTransaction(
      baseTx.typeId,
      baseTx.networkId,
      baseTx.blockchainId,
      baseTx.outputs,
      baseTx.inputs,
      baseTx.memo,
      sourceChain,
      importedInputs
    )
  }
}
