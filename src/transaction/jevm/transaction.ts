import { JuneoBuffer, type Serializable } from '../../utils'
import {
  AssetIdSize,
  BlockchainIdSize,
  CodecId,
  EVMExportTransactionTypeId,
  EVMImportTransactionTypeId,
  EVMInputSize,
  EVMOutputSize,
  TransactionIdSize
} from '../constants'
import { type Spendable, TransferableInput } from '../input'
import { TransferableOutput } from '../output'
import { AbstractSignable, SignableTx, type Signer } from '../signature'
import { Address, AssetId, type BlockchainId, type Signature } from '../types'

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
    const buffer: JuneoBuffer = JuneoBuffer.alloc(EVMOutputSize)
    buffer.write(this.address.serialize())
    buffer.writeUInt64(this.amount)
    buffer.write(this.assetId.serialize())
    return buffer
  }

  static comparator = (a: EVMOutput, b: EVMOutput): number => {
    const comparison: number = Address.comparator(a.address, b.address)
    if (comparison !== 0) {
      return comparison
    }
    return AssetId.comparator(a.assetId, b.assetId)
  }
}

export class EVMInput extends AbstractSignable implements Serializable, Spendable {
  address: Address
  amount: bigint
  assetId: AssetId
  nonce: bigint

  constructor (address: Address, amount: bigint, assetId: AssetId, nonce: bigint) {
    super()
    this.address = address
    this.amount = amount
    this.assetId = assetId
    this.nonce = nonce
  }

  getAmount (): bigint {
    return this.amount
  }

  getAssetId (): AssetId {
    return this.assetId
  }

  async sign (bytes: JuneoBuffer, signers: Signer[]): Promise<Signature[]> {
    return await super.sign(bytes, signers, this.address, [])
  }

  getThreshold (): number {
    return 1
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(EVMInputSize)
    buffer.write(this.address.serialize())
    buffer.writeUInt64(this.amount)
    buffer.write(this.assetId.serialize())
    buffer.writeUInt64(this.nonce)
    return buffer
  }

  static comparator = (a: EVMInput, b: EVMInput): number => {
    let comparison: number = JuneoBuffer.comparator(a.address.serialize(), b.address.serialize())
    if (comparison === 0) {
      comparison = JuneoBuffer.comparator(a.assetId.serialize(), b.assetId.serialize())
    }
    return comparison
  }
}

export class JEVMExportTransaction extends SignableTx implements Serializable {
  codecId: number = CodecId
  typeId: number = EVMExportTransactionTypeId
  networkId: number
  blockchainId: BlockchainId
  destinationChain: BlockchainId
  inputs: EVMInput[]
  exportedOutputs: TransferableOutput[]

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    destinationChain: BlockchainId,
    inputs: EVMInput[],
    exportedOutputs: TransferableOutput[]
  ) {
    super()
    this.networkId = networkId
    this.blockchainId = blockchainId
    this.destinationChain = destinationChain
    this.inputs = inputs
    this.inputs.sort(EVMInput.comparator)
    this.exportedOutputs = exportedOutputs
    this.exportedOutputs.sort(TransferableOutput.comparator)
  }

  async signTransaction (signers: Signer[]): Promise<JuneoBuffer> {
    return await super.sign(this.serialize(), this.inputs, signers)
  }

  serialize (): JuneoBuffer {
    const inputsBytes: JuneoBuffer[] = []
    let inputsSize: number = 0
    for (const input of this.inputs) {
      const bytes: JuneoBuffer = input.serialize()
      inputsSize += bytes.length
      inputsBytes.push(bytes)
    }
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize: number = 0
    for (const output of this.exportedOutputs) {
      const bytes: JuneoBuffer = output.serialize()
      outputsSize += bytes.length
      outputsBytes.push(bytes)
    }
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
    for (const input of inputsBytes) {
      buffer.write(input)
    }
    buffer.writeUInt32(this.exportedOutputs.length)
    for (const output of outputsBytes) {
      buffer.write(output)
    }
    return buffer
  }

  static estimateSignaturesCount (exportedAssets: string[], exportFeeAssetId: string, importFeeAssetId: string): number {
    // see if import/export fee outputs will be merged with exported assets
    const ignoreImportFee: boolean = exportedAssets.includes(importFeeAssetId)
    const ignoreExportFee: boolean = exportedAssets.includes(exportFeeAssetId)
    let feeInputsCount: number = ignoreImportFee ? 0 : 1
    // import and export fee could also be merged together
    if (!ignoreExportFee && exportFeeAssetId !== importFeeAssetId) {
      feeInputsCount += 1
    }
    return exportedAssets.length + feeInputsCount
  }

  static estimateSize (inputsCount: number): number {
    // for now consider inputs + 2 outputs for fees outputs
    const outputsCount: number = inputsCount
    // 2 + 4 + 4 + 4 + 4 = 18
    return 18 + BlockchainIdSize * 2 + EVMInputSize * inputsCount + this.estimateOutputsSize(outputsCount)
  }

  private static estimateOutputsSize (outputsCount: number): number {
    // TransferableOutput size
    // 4 + 8 + 8 + 4 + 4 = 28 + 20 * addressesCount
    // addresses count most likely will be 1 so = 48
    return AssetIdSize + 48 * outputsCount
  }
}

export class JEVMImportTransaction extends SignableTx implements Serializable {
  codecId: number = CodecId
  typeId: number = EVMImportTransactionTypeId
  networkId: number
  blockchainId: BlockchainId
  sourceChain: BlockchainId
  importedInputs: TransferableInput[]
  outputs: EVMOutput[]

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    sourceChain: BlockchainId,
    importedInputs: TransferableInput[],
    outputs: EVMOutput[]
  ) {
    super()
    this.networkId = networkId
    this.blockchainId = blockchainId
    this.sourceChain = sourceChain
    this.importedInputs = importedInputs
    this.importedInputs.sort(TransferableInput.comparator)
    this.outputs = outputs
    this.outputs.sort(EVMOutput.comparator)
  }

  async signTransaction (signers: Signer[]): Promise<JuneoBuffer> {
    return await super.sign(this.serialize(), this.importedInputs, signers)
  }

  serialize (): JuneoBuffer {
    const inputsBytes: JuneoBuffer[] = []
    let inputsSize: number = 0
    for (const input of this.importedInputs) {
      const bytes: JuneoBuffer = input.serialize()
      inputsSize += bytes.length
      inputsBytes.push(bytes)
    }
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize: number = 0
    for (const output of this.outputs) {
      const bytes: JuneoBuffer = output.serialize()
      outputsSize += bytes.length
      outputsBytes.push(bytes)
    }
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
    for (const input of inputsBytes) {
      buffer.write(input)
    }
    buffer.writeUInt32(this.outputs.length)
    for (const output of outputsBytes) {
      buffer.write(output)
    }
    return buffer
  }

  static estimateSize (inputsCount: number, outputsCount: number): number {
    // 2 + 4 + 4 + 4 + 4 = 18
    return 18 + BlockchainIdSize * 2 + this.estimateInputsSize(inputsCount) + EVMOutputSize * outputsCount
  }

  private static estimateInputsSize (inputsCount: number): number {
    // TransferableInput size
    // 4 + 8 + 4 = 16 + 4 * addressesCount
    // addresses count most likely will be 1 so = 20
    return (TransactionIdSize + 4 + AssetIdSize + 20) * inputsCount
  }
}
