import { type JEVMAPI } from '../../api/jevm/api'
import { JuneoBuffer, type Serializable } from '../../utils'
import { sleep } from '../../utils/time'
import { TransferableInput } from '../input'
import { TransferableOutput } from '../output'
import { CodecId } from '../transaction'
import { type Address, AddressSize, type AssetId, AssetIdSize, BlockchainIdSize, type BlockchainId } from '../types'

const ImportTransactionTypeId: number = 0
const ExportTransactionTypeId: number = 1

export enum JEVMTransactionStatus {
  Accepted = 'Accepted',
  Processing = 'Processing',
  Dropped = 'Dropped',
  Unknown = 'Unknown'
}

export class JEVMTransactionStatusFetcher {
  jevmApi: JEVMAPI
  delay: number
  private attempts: number = 0
  maxAttempts: number
  transactionId: string
  currentStatus: string = JEVMTransactionStatus.Unknown

  constructor (jevmApi: JEVMAPI, delay: number, maxAttempts: number, transactionId: string) {
    this.jevmApi = jevmApi
    this.delay = delay
    this.maxAttempts = maxAttempts
    this.transactionId = transactionId
  }

  getAttemptsCount (): number {
    return this.attempts
  }

  async fetch (): Promise<string> {
    while (this.attempts < this.maxAttempts && this.currentStatus !== JEVMTransactionStatus.Accepted) {
      this.currentStatus = (await this.jevmApi.getTxStatus(this.transactionId)).status
      await sleep(this.delay)
      this.attempts += 1
    }
    return this.currentStatus
  }
}

export class EVMOutput implements Serializable {
  address: Address
  amount: bigint
  assetId: AssetId

  constructor (address: Address, amount: bigint, assetId: AssetId) {
    this.address = address
    this.amount = amount
    this.assetId = assetId
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      AddressSize + 8 + AssetIdSize
    )
    buffer.write(this.address.serialize())
    buffer.writeUInt64(this.amount)
    buffer.write(this.assetId.serialize())
    return buffer
  }

  static comparator = (a: EVMOutput, b: EVMOutput): number => {
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
  }
}

export class EVMInput implements Serializable {
  address: Address
  amount: bigint
  assetId: AssetId
  nonce: bigint

  constructor (address: Address, amount: bigint, assetId: AssetId, nonce: bigint) {
    this.address = address
    this.amount = amount
    this.assetId = assetId
    this.nonce = nonce
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      AddressSize + 8 + AssetIdSize + 8
    )
    buffer.write(this.address.serialize())
    buffer.writeUInt64(this.amount)
    buffer.write(this.assetId.serialize())
    buffer.writeUInt64(this.nonce)
    return buffer
  }

  static comparator = (a: EVMInput, b: EVMInput): number => {
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
  }
}

export class JEVMExportTransaction implements Serializable {
  codecId: number = CodecId
  typeId: number = ExportTransactionTypeId
  networkId: number
  blockchainId: BlockchainId
  destinationChain: BlockchainId
  inputs: EVMInput[]
  exportedOutputs: TransferableOutput[]

  constructor (networkId: number, blockchainId: BlockchainId, destinationChain: BlockchainId,
    inputs: EVMInput[], exportedOutputs: TransferableOutput[]) {
    this.networkId = networkId
    this.blockchainId = blockchainId
    this.destinationChain = destinationChain
    this.inputs = inputs
    this.inputs.sort(EVMInput.comparator)
    this.exportedOutputs = exportedOutputs
    this.exportedOutputs.sort(TransferableOutput.comparator)
  }

  serialize (): JuneoBuffer {
    const inputsBytes: JuneoBuffer[] = []
    let inputsSize: number = 0
    this.inputs.forEach(input => {
      const bytes: JuneoBuffer = input.serialize()
      inputsSize += bytes.length
      inputsBytes.push(bytes)
    })
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize: number = 0
    this.exportedOutputs.forEach(output => {
      const bytes: JuneoBuffer = output.serialize()
      outputsSize += bytes.length
      outputsBytes.push(bytes)
    })
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 2 + 4 + 4 + 4 + 4 = 18
      18 + BlockchainIdSize * 2 + inputsSize + outputsSize
    )
    buffer.writeUInt16(this.codecId)
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.networkId)
    buffer.write(this.blockchainId.serialize())
    buffer.write(this.destinationChain.serialize())
    buffer.writeUInt32(this.inputs.length)
    inputsBytes.forEach(input => {
      buffer.write(input)
    })
    buffer.writeUInt32(this.exportedOutputs.length)
    outputsBytes.forEach(output => {
      buffer.write(output)
    })
    return buffer
  }
}

export class JEVMImportTransaction implements Serializable {
  codecId: number = CodecId
  typeId: number = ImportTransactionTypeId
  networkId: number
  blockchainId: BlockchainId
  sourceChain: BlockchainId
  importedInputs: TransferableInput[]
  outputs: EVMOutput[]

  constructor (networkId: number, blockchainId: BlockchainId, sourceChain: BlockchainId,
    importedInputs: TransferableInput[], outputs: EVMOutput[]) {
    this.networkId = networkId
    this.blockchainId = blockchainId
    this.sourceChain = sourceChain
    this.importedInputs = importedInputs
    this.importedInputs.sort(TransferableInput.comparator)
    this.outputs = outputs
    this.outputs.sort(EVMOutput.comparator)
  }

  serialize (): JuneoBuffer {
    const inputsBytes: JuneoBuffer[] = []
    let inputsSize: number = 0
    this.importedInputs.forEach(input => {
      const bytes: JuneoBuffer = input.serialize()
      inputsSize += bytes.length
      inputsBytes.push(bytes)
    })
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize: number = 0
    this.outputs.forEach(output => {
      const bytes: JuneoBuffer = output.serialize()
      outputsSize += bytes.length
      outputsBytes.push(bytes)
    })
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 2 + 4 + 4 + 4 + 4 = 18
      18 + BlockchainIdSize * 2 + inputsSize + outputsSize
    )
    buffer.writeUInt16(this.codecId)
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.networkId)
    buffer.write(this.blockchainId.serialize())
    buffer.write(this.sourceChain.serialize())
    buffer.writeUInt32(this.importedInputs.length)
    inputsBytes.forEach(input => {
      buffer.write(input)
    })
    buffer.writeUInt32(this.outputs.length)
    outputsBytes.forEach(output => {
      buffer.write(output)
    })
    return buffer
  }
}
