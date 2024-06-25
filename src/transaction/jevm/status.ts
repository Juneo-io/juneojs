import { type JEVMAPI } from '../../api'
import { TimeUtils } from '../../utils'
import { type TransactionStatusFetcher } from '../transaction'

export enum JEVMTransactionStatus {
  Accepted = 'Accepted',
  Processing = 'Processing',
  Dropped = 'Dropped',
  Unknown = 'Unknown',
}

export class JEVMTransactionStatusFetcher implements TransactionStatusFetcher {
  jevmApi: JEVMAPI
  private attempts: number = 0
  transactionId: string
  currentStatus: string = JEVMTransactionStatus.Unknown

  constructor (jevmApi: JEVMAPI, transactionId: string) {
    this.jevmApi = jevmApi
    this.transactionId = transactionId
  }

  async fetch (timeout: number, delay: number): Promise<string> {
    const maxAttempts = timeout / delay
    this.currentStatus = JEVMTransactionStatus.Processing
    while (this.attempts < maxAttempts && !this.isCurrentStatusSettled()) {
      await TimeUtils.sleep(delay)
      const receipt: any = await this.jevmApi.getTx(this.transactionId).catch(() => {
        return null
      })
      if (receipt === null) {
        this.attempts += 1
        continue
      }
      this.currentStatus = (await this.jevmApi.getTxStatus(this.transactionId)).status
      this.attempts += 1
    }
    return this.currentStatus
  }

  private isCurrentStatusSettled (): boolean {
    return (
      this.currentStatus !== JEVMTransactionStatus.Unknown && this.currentStatus !== JEVMTransactionStatus.Processing
    )
  }
}

export enum EVMTransactionStatus {
  Success = 'Success',
  Failure = 'Failure',
  Pending = 'Pending',
  Unknown = 'Unknown',
}

export class EVMTransactionStatusFetcher implements TransactionStatusFetcher {
  jevmApi: JEVMAPI
  private attempts: number = 0
  transactionHash: string
  currentStatus: string = EVMTransactionStatus.Unknown

  constructor (jevmApi: JEVMAPI, transactionHash: string) {
    this.jevmApi = jevmApi
    this.transactionHash = transactionHash
  }

  async fetch (timeout: number, delay: number): Promise<string> {
    const maxAttempts = timeout / delay
    this.currentStatus = EVMTransactionStatus.Pending
    while (this.attempts < maxAttempts) {
      await TimeUtils.sleep(delay)
      const receipt: any = await this.jevmApi.eth_getTransactionReceipt(this.transactionHash).catch(() => {
        return null
      })
      if (receipt === null) {
        this.attempts += 1
        continue
      }
      const status = Number(receipt.status)
      this.currentStatus = status === 1 ? EVMTransactionStatus.Success : EVMTransactionStatus.Failure
      break
    }
    return this.currentStatus
  }
}
