import { type JEVMAPI } from '../../api/jevm/api'
import { InputError, JuneoBuffer, sha256, type Serializable } from '../../utils'
import { sleep } from '../../utils/time'
import { JEVMWallet, type VMWallet } from '../../wallet/wallet'
import { type Spendable, TransferableInput, type UserInput } from '../input'
import { TransferableOutput } from '../output'
import { sign, type Signable } from '../signature'
import { CodecId } from '../transaction'
import { type Address, AddressSize, type AssetId, AssetIdSize, BlockchainIdSize, type BlockchainId, Signature, TransactionIdSize } from '../types'

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
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
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
    for (let i = 0; i < wallets.length; i++) {
      if (!(wallets[i] instanceof JEVMWallet)) {
        continue
      }
      const wallet: JEVMWallet = wallets[i] as JEVMWallet
      if (address.matches(wallet.getHexAddress())) {
        signatures.push(new Signature(wallet.sign(sha256(bytes))))
        break
      }
    }
    if (signatures.length < 1) {
      throw new InputError('missing wallets to complete signatures')
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

  signTransaction (wallets: VMWallet[]): JuneoBuffer {
    return sign(this.serialize(), this.inputs, wallets)
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

  static estimateSignaturesCount (userInputs: UserInput[], exportFeeAssetId: string, importFeeAssetId: string): number {
    // see if import/export fee outputs will be merged with user outputs only if merging after estimate
    let ignoreImportFee: boolean = false
    let ignoreExportFee: boolean = false
    userInputs.forEach(input => {
      if (input.assetId === exportFeeAssetId) {
        ignoreExportFee = true
      }
      if (input.assetId === importFeeAssetId) {
        ignoreImportFee = true
      }
    })
    let feeInputsCount: number = ignoreImportFee ? 0 : 1
    // import and export fee could also be merged together
    if (!ignoreExportFee && exportFeeAssetId !== importFeeAssetId) {
      feeInputsCount += 1
    }
    return userInputs.length + feeInputsCount
  }

  static estimateSize (inputsCount: number): number {
    // for now consider inputs + 2 outputs for fees outputs
    const outputsCount: number = inputsCount + 2
    // 2 + 4 + 4 + 4 + 4 = 18
    return 18 + BlockchainIdSize * 2 + EVMInput.Size * inputsCount + this.estimateOutputsSize(outputsCount)
  }

  private static estimateOutputsSize (inputsCount: number): number {
    // TransferableOutput size
    // 4 + 8 + 8 + 4 + 4 = 28 + 20 * addressesCount
    // addresses count most likely will be 1 so = 48
    return AssetIdSize + 48 * inputsCount
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

  signTransaction (wallets: VMWallet[]): JuneoBuffer {
    return sign(this.serialize(), this.importedInputs, wallets)
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

  static estimateSignaturesCount (userInputs: UserInput[], feeAssetId: string, mergedInputs: boolean): number {
    // fee output will be merged with user outputs if has same asset id and explicitly merged after estimate
    let ignoreFeeInput: boolean = false
    if (mergedInputs) {
      userInputs.forEach(input => {
        if (input.assetId === feeAssetId) {
          ignoreFeeInput = true
        }
      })
    }
    const feeInputsCount: number = ignoreFeeInput ? 0 : 1
    return userInputs.length + feeInputsCount
  }

  static estimateSize (inputsCount: number, mergedInputs: boolean): number {
    const outputsCount: number = mergedInputs ? inputsCount : inputsCount - 1
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
