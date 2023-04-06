import { type JEVMAPI } from '../../api/jevm/api'
import { JuneoBuffer, type Serializable } from '../../utils'
import { sleep } from '../../utils/time'
import { type TransferableInput } from '../input'
import { type TransferableOutput } from '../output'
import { CodecId } from '../transaction'
import { type Address, AddressSize, type AssetId, AssetIdSize, BlockchainIdSize, type BlockchainId } from '../types'

const ExportTransactionTypeId: number = 1
const ImportTransactionTypeId: number = 0

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
}
