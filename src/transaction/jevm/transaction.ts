import { JuneoBuffer, sha256, type Serializable, SignatureError } from '../../utils'
import { type VMWallet } from '../../wallet'
import { type Spendable, TransferableInput } from '../input'
import { TransferableOutput } from '../output'
import { sign, type Signable } from '../signature'
import { CodecId } from '../transaction'
import {
  Address,
  AddressSize,
  AssetId,
  AssetIdSize,
  BlockchainIdSize,
  type BlockchainId,
  Signature,
  TransactionIdSize
} from '../types'

const ImportTransactionTypeId: number = 0
const ExportTransactionTypeId: number = 1

export class EVMOutput implements Serializable {
  static Size: number = AddressSize + 8 + AssetIdSize
  address: Address
  amount: bigint
  assetId: AssetId

  constructor (address: Address, amount: bigint, assetId: AssetId) {
    this.address = address
    this.amount = amount
    this.assetId = assetId
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(EVMOutput.Size)
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

export class EVMInput implements Serializable, Signable, Spendable {
  static Size: number = AddressSize + 8 + AssetIdSize + 8
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

  getAmount (): bigint {
    return this.amount
  }

  getAssetId (): AssetId {
    return this.assetId
  }

  sign (bytes: JuneoBuffer, wallets: VMWallet[]): Signature[] {
    const signatures: Signature[] = []
    const address: Address = this.address
    for (const wallet of wallets) {
      if (address.matches(wallet.getAddress())) {
        signatures.push(new Signature(wallet.sign(sha256(bytes))))
        break
      }
    }
    if (signatures.length < 1) {
      throw new SignatureError('missing wallets to complete signatures')
    }
    return signatures
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(EVMInput.Size)
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

export class JEVMExportTransaction implements Serializable {
  codecId: number = CodecId
  typeId: number = ExportTransactionTypeId
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
    this.networkId = networkId
    this.blockchainId = blockchainId
    this.destinationChain = destinationChain
    this.inputs = inputs
    this.inputs.sort(EVMInput.comparator)
    this.exportedOutputs = exportedOutputs
    this.exportedOutputs.sort(TransferableOutput.comparator)
  }

  signTransaction (wallets: VMWallet[]): JuneoBuffer {
    return sign(this.serialize(), this.inputs, wallets)
  }

  serialize (): JuneoBuffer {
    const inputsBytes: JuneoBuffer[] = []
    let inputsSize: number = 0
    this.inputs.forEach((input) => {
      const bytes: JuneoBuffer = input.serialize()
      inputsSize += bytes.length
      inputsBytes.push(bytes)
    })
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize: number = 0
    this.exportedOutputs.forEach((output) => {
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
    inputsBytes.forEach((input) => {
      buffer.write(input)
    })
    buffer.writeUInt32(this.exportedOutputs.length)
    outputsBytes.forEach((output) => {
      buffer.write(output)
    })
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
    return 18 + BlockchainIdSize * 2 + EVMInput.Size * inputsCount + this.estimateOutputsSize(outputsCount)
  }

  private static estimateOutputsSize (outputsCount: number): number {
    // TransferableOutput size
    // 4 + 8 + 8 + 4 + 4 = 28 + 20 * addressesCount
    // addresses count most likely will be 1 so = 48
    return AssetIdSize + 48 * outputsCount
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

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    sourceChain: BlockchainId,
    importedInputs: TransferableInput[],
    outputs: EVMOutput[]
  ) {
    this.networkId = networkId
    this.blockchainId = blockchainId
    this.sourceChain = sourceChain
    this.importedInputs = importedInputs
    this.importedInputs.sort(TransferableInput.comparator)
    this.outputs = outputs
    this.outputs.sort(EVMOutput.comparator)
  }

  signTransaction (wallets: VMWallet[]): JuneoBuffer {
    return sign(this.serialize(), this.importedInputs, wallets)
  }

  serialize (): JuneoBuffer {
    const inputsBytes: JuneoBuffer[] = []
    let inputsSize: number = 0
    this.importedInputs.forEach((input) => {
      const bytes: JuneoBuffer = input.serialize()
      inputsSize += bytes.length
      inputsBytes.push(bytes)
    })
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize: number = 0
    this.outputs.forEach((output) => {
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
    inputsBytes.forEach((input) => {
      buffer.write(input)
    })
    buffer.writeUInt32(this.outputs.length)
    outputsBytes.forEach((output) => {
      buffer.write(output)
    })
    return buffer
  }

  static estimateSize (inputsCount: number, outputsCount: number): number {
    // 2 + 4 + 4 + 4 + 4 = 18
    return 18 + BlockchainIdSize * 2 + this.estimateInputsSize(inputsCount) + EVMOutput.Size * outputsCount
  }

  private static estimateInputsSize (inputsCount: number): number {
    // TransferableInput size
    // 4 + 8 + 4 = 16 + 4 * addressesCount
    // addresses count most likely will be 1 so = 20
    return (TransactionIdSize + 4 + AssetIdSize + 20) * inputsCount
  }
}
