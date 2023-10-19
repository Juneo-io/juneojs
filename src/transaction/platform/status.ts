import { type PlatformAPI } from '../../api'
import { sleep } from '../../utils'
import { type TransactionStatusFetcher, TransactionStatusFetchDelay } from '../transaction'

export enum PlatformTransactionStatus {
  Committed = 'Committed',
  Aborted = 'Aborted',
  Processing = 'Processing',
  Dropped = 'Dropped',
  Unknown = 'Unknown',
}

export class PlatformTransactionStatusFetcher implements TransactionStatusFetcher {
  platformApi: PlatformAPI
  private attempts: number = 0
  transactionId: string
  currentStatus: string = PlatformTransactionStatus.Unknown

  constructor (platformApi: PlatformAPI, transactionId: string) {
    this.platformApi = platformApi
    this.transactionId = transactionId
  }

  async fetch (timeout: number, delay: number = TransactionStatusFetchDelay): Promise<string> {
    const maxAttempts: number = timeout / delay
    while (this.attempts < maxAttempts && !this.isCurrentStatusSettled()) {
      await sleep(delay)
      this.currentStatus = await this.platformApi.getTxStatus(this.transactionId).then(
        (value) => {
          return value.status
        },
        () => {
          return PlatformTransactionStatus.Unknown
        }
      )
      this.attempts += 1
    }
    return this.currentStatus
  }

  private isCurrentStatusSettled (): boolean {
    return (
      this.currentStatus !== PlatformTransactionStatus.Unknown &&
      this.currentStatus !== PlatformTransactionStatus.Processing
    )
  }
}
