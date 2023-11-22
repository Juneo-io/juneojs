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
    this.currentStatus = PlatformTransactionStatus.Processing
    while (this.attempts < maxAttempts && !this.isCurrentStatusSettled()) {
      await sleep(delay)
      await this.platformApi.getTxStatus(this.transactionId).then(
        (value) => {
          this.currentStatus = value.status
        },
        (error) => {
          if (error.message !== 'not found') {
            this.currentStatus = PlatformTransactionStatus.Unknown
          }
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
