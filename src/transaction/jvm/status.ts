import { type JVMAPI } from '../../api'
import { TimeUtils } from '../../utils'
import { type TransactionStatusFetcher } from '../transaction'

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

  async fetch (timeout: number, delay: number): Promise<string> {
    const maxAttempts: number = timeout / delay
    this.currentStatus = JVMTransactionStatus.Processing
    while (this.attempts < maxAttempts) {
      await TimeUtils.sleep(delay)
      const receipt: any = await this.jvmApi.getTx(this.transactionId).catch(() => {
        return null
      })
      if (receipt === null) {
        this.attempts += 1
        continue
      }
      this.currentStatus = JVMTransactionStatus.Accepted
      break
    }
    return this.currentStatus
  }
}
