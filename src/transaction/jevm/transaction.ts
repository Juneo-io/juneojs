import { JuneoBuffer, type Serializable } from '../../utils'
import {
  AddressSize,
  AssetIdSize,
  BlockchainIdSize,
  EVMExportTransactionTypeId,
  EVMImportTransactionTypeId,
  EVMInputSize,
  EVMOutputSize,
  InvalidTypeId,
  TransactionIdSize
} from '../constants'
import { type Spendable, TransferableInput } from '../input'
import { TransferableOutput } from '../output'
import { AbstractSignable, type Signable } from '../signature'
import { ExportTransaction, ImportTransaction } from '../transaction'
import { Address, AssetId, BlockchainId } from '../types'

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
    const buffer = JuneoBuffer.alloc(EVMOutputSize)
    buffer.write(this.address)
    buffer.writeUInt64(this.amount)
    buffer.write(this.assetId)
    return buffer
  }

  static parse (data: string | JuneoBuffer): EVMOutput {
    const reader = JuneoBuffer.from(data).createReader()
    const address = new Address(reader.read(AddressSize))
    const amount = reader.readUInt64()
    const assetId = new AssetId(reader.read(AssetIdSize).toCB58())
    return new EVMOutput(address, amount, assetId)
  }

  static comparator = (a: EVMOutput, b: EVMOutput): number => {
    const comparison = Address.comparator(a.address, b.address)
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

  getTypeId (): number {
    return InvalidTypeId
  }

  getAmount (): bigint {
    return this.amount
  }

  getAssetId (): AssetId {
    return this.assetId
  }

  getAddresses (): Address[] {
    return [this.address]
  }

  getThreshold (): number {
    return 1
  }

  serialize (): JuneoBuffer {
    const buffer = JuneoBuffer.alloc(EVMInputSize)
    buffer.write(this.address)
    buffer.writeUInt64(this.amount)
    buffer.write(this.assetId)
    buffer.writeUInt64(this.nonce)
    return buffer
  }

  static parse (data: string | JuneoBuffer): EVMInput {
    const reader = JuneoBuffer.from(data).createReader()
    const address = new Address(reader.read(AddressSize))
    const amount = reader.readUInt64()
    const assetId = new AssetId(reader.read(AssetIdSize).toCB58())
    const nonce = reader.readUInt64()
    return new EVMInput(address, amount, assetId, nonce)
  }

  static comparator = (a: EVMInput, b: EVMInput): number => {
    let comparison = JuneoBuffer.comparator(a.address.serialize(), b.address.serialize())
    if (comparison === 0) {
      comparison = JuneoBuffer.comparator(a.assetId.serialize(), b.assetId.serialize())
    }
    return comparison
  }
}

export class JEVMExportTransaction extends ExportTransaction {
  evmInputs: EVMInput[]

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    destinationChain: BlockchainId,
    inputs: EVMInput[],
    exportedOutputs: TransferableOutput[]
  ) {
    super(EVMExportTransactionTypeId, networkId, blockchainId, [], [], '', destinationChain, exportedOutputs)
    this.evmInputs = inputs
    this.evmInputs.sort(EVMInput.comparator)
  }

  getSignables (): Signable[] {
    return this.evmInputs
  }

  serialize (): JuneoBuffer {
    const inputsBytes: JuneoBuffer[] = []
    let inputsSize = 0
    for (const input of this.evmInputs) {
      const bytes = input.serialize()
      inputsSize += bytes.length
      inputsBytes.push(bytes)
    }
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize = 0
    for (const output of this.exportedOutputs) {
      const bytes = output.serialize()
      outputsSize += bytes.length
      outputsBytes.push(bytes)
    }
    const buffer = JuneoBuffer.alloc(
      // 2 + 4 + 4 + 4 + 4 = 18
      18 + BlockchainIdSize * 2 + inputsSize + outputsSize
    )
    buffer.writeUInt16(this.codecId)
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.networkId)
    buffer.write(this.blockchainId)
    buffer.write(this.destinationChain)
    buffer.writeUInt32(this.evmInputs.length)
    for (const input of inputsBytes) {
      buffer.write(input)
    }
    buffer.writeUInt32(this.exportedOutputs.length)
    for (const output of outputsBytes) {
      buffer.write(output)
    }
    return buffer
  }

  static parse (data: string | JuneoBuffer): JEVMExportTransaction {
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    // skip codec reading
    reader.skip(2)
    reader.readAndVerifyTypeId(EVMExportTransactionTypeId)
    const networkId = reader.readUInt32()
    const blockchainId = new BlockchainId(reader.read(BlockchainIdSize).toCB58())
    const destinationChain = new BlockchainId(reader.read(BlockchainIdSize).toCB58())
    const inputsLength = reader.readUInt32()
    const inputs: EVMInput[] = []
    for (let i = 0; i < inputsLength; i++) {
      const input = EVMInput.parse(reader.peekRemaining())
      reader.skip(input)
      inputs.push(input)
    }
    const exportedOutputsLength = reader.readUInt32()
    const exportedOutputs: TransferableOutput[] = []
    for (let i = 0; i < exportedOutputsLength; i++) {
      const output = TransferableOutput.parse(reader.peekRemaining())
      reader.skip(output)
      exportedOutputs.push(output)
    }
    return new JEVMExportTransaction(networkId, blockchainId, destinationChain, inputs, exportedOutputs)
  }

  static estimateSignaturesCount (exportedAssets: string[], exportFeeAssetId: string, importFeeAssetId: string): number {
    // see if import/export fee outputs will be merged with exported assets
    const ignoreImportFee = exportedAssets.includes(importFeeAssetId)
    const ignoreExportFee = exportedAssets.includes(exportFeeAssetId)
    let feeInputsCount = ignoreImportFee ? 0 : 1
    // import and export fee could also be merged together
    if (!ignoreExportFee && exportFeeAssetId !== importFeeAssetId) {
      feeInputsCount += 1
    }
    return exportedAssets.length + feeInputsCount
  }

  static estimateSize (inputsCount: number): number {
    // for now consider inputs + 2 outputs for fees outputs
    const outputsCount = inputsCount
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

export class JEVMImportTransaction extends ImportTransaction {
  evmOutputs: EVMOutput[]

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    sourceChain: BlockchainId,
    importedInputs: TransferableInput[],
    evmOutputs: EVMOutput[]
  ) {
    super(EVMImportTransactionTypeId, networkId, blockchainId, [], [], '', sourceChain, importedInputs)
    this.importedInputs.sort(TransferableInput.comparator)
    this.evmOutputs = evmOutputs
    this.evmOutputs.sort(EVMOutput.comparator)
  }

  serialize (): JuneoBuffer {
    const inputsBytes: JuneoBuffer[] = []
    let inputsSize = 0
    for (const input of this.importedInputs) {
      const bytes = input.serialize()
      inputsSize += bytes.length
      inputsBytes.push(bytes)
    }
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize = 0
    for (const output of this.evmOutputs) {
      const bytes = output.serialize()
      outputsSize += bytes.length
      outputsBytes.push(bytes)
    }
    const buffer = JuneoBuffer.alloc(
      // 2 + 4 + 4 + 4 + 4 = 18
      18 + BlockchainIdSize * 2 + inputsSize + outputsSize
    )
    buffer.writeUInt16(this.codecId)
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.networkId)
    buffer.write(this.blockchainId)
    buffer.write(this.sourceChain)
    buffer.writeUInt32(this.importedInputs.length)
    for (const input of inputsBytes) {
      buffer.write(input)
    }
    buffer.writeUInt32(this.evmOutputs.length)
    for (const output of outputsBytes) {
      buffer.write(output)
    }
    return buffer
  }

  static parse (data: string | JuneoBuffer): JEVMImportTransaction {
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    // skip codec reading
    reader.skip(2)
    reader.readAndVerifyTypeId(EVMImportTransactionTypeId)
    const networkId = reader.readUInt32()
    const blockchainId = new BlockchainId(reader.read(BlockchainIdSize).toCB58())
    const sourceChain = new BlockchainId(reader.read(BlockchainIdSize).toCB58())
    const importedInputsLength = reader.readUInt32()
    const importedInputs: TransferableInput[] = []
    for (let i = 0; i < importedInputsLength; i++) {
      const input = TransferableInput.parse(reader.peekRemaining())
      reader.skip(input)
      importedInputs.push(input)
    }
    const outputsLength = reader.readUInt32()
    const outputs: EVMOutput[] = []
    for (let i = 0; i < outputsLength; i++) {
      const output = EVMOutput.parse(reader.peekRemaining())
      reader.skip(output)
      outputs.push(output)
    }
    return new JEVMImportTransaction(networkId, blockchainId, sourceChain, importedInputs, outputs)
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
