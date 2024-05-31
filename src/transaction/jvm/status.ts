import { type JVMAPI } from '../../api'
import { TimeUtils } from '../../utils'
import { type TransactionStatusFetcher, TransactionStatusFetchDelay } from '../transaction'

export enum JVMTransactionStatus {
  Accepted = 'Accepted',
  Processing = 'Processing',
  Unknown = 'Unknown',
}

export class JVMTransactionStatusFetcher implements TransactionStatusFetcher {
  jvmApi: JVMAPI
  private attempts: number = 0
  transactionId: string
  currentStatus: string = JVMTransactionStatus.Unknown

  constructor (jvmApi: JVMAPI, transactionId: string) {
    this.jvmApi = jvmApi
    this.transactionId = transactionId
  }

  async fetch (timeout: number, delay: number = TransactionStatusFetchDelay): Promise<string> {
    const maxAttempts: number = timeout / delay
    this.currentStatus = JVMTransactionStatus.Processing
    while (this.attempts < maxAttempts && !this.isCurrentStatusSettled()) {
      await TimeUtils.sleep(delay)
      await this.jvmApi.getTx(this.transactionId).then(
        () => {
          this.currentStatus = JVMTransactionStatus.Accepted
        },
        (error) => {
          if (error.message !== 'not found') {
            this.currentStatus = JVMTransactionStatus.Unknown
          }
        }
      )
      this.attempts += 1
    }
    return this.currentStatus
  }

  private isCurrentStatusSettled (): boolean {
    return this.currentStatus !== JVMTransactionStatus.Unknown && this.currentStatus !== JVMTransactionStatus.Processing
  }
}
