import { type PlatformAPI } from '../../api'
import { TimeUtils } from '../../utils'
import { type TransactionStatusFetcher } from '../transaction'

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

  async fetch (timeout: number, delay: number): Promise<string> {
    const maxAttempts: number = timeout / delay
    this.currentStatus = PlatformTransactionStatus.Processing
    while (this.attempts < maxAttempts && !this.isCurrentStatusSettled()) {
      await TimeUtils.sleep(delay)
      const receipt: any = await this.platformApi.getTx(this.transactionId).catch(() => {
        return null
      })
      if (receipt === null) {
        this.attempts += 1
        continue
      }
      this.currentStatus = (await this.platformApi.getTxStatus(this.transactionId)).status
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
