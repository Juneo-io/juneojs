import { type JVMAPI } from '../../api/jvm'
import { sleep } from '../../utils'
import { type TransferableInput } from '../input'
import { type TransferableOutput } from '../output'
import { type Signable } from '../signature'
import { AbstractBaseTx } from '../transaction'
import { type BlockchainId } from '../types'

export enum JVMTransactionStatus {
  Accepted = 'Accepted',
  Processing = 'Processing',
  Rejected = 'Rejected',
  Unknown = 'Unknown'
}

export class JVMTransactionStatusFetcher {
  jvmApi: JVMAPI
  delay: number
  private attempts: number = 0
  maxAttempts: number
  transactionId: string
  currentStatus: string = JVMTransactionStatus.Unknown

  constructor (jvmApi: JVMAPI, delay: number, maxAttempts: number, transactionId: string) {
    this.jvmApi = jvmApi
    this.delay = delay
    this.maxAttempts = maxAttempts
    this.transactionId = transactionId
  }

  getAttemptsCount (): number {
    return this.attempts
  }

  async fetch (): Promise<string> {
    while (this.attempts < this.maxAttempts && this.currentStatus !== JVMTransactionStatus.Accepted) {
      this.currentStatus = (await this.jvmApi.getTxStatus(this.transactionId)).status
      await sleep(this.delay)
      this.attempts += 1
    }
    return this.currentStatus
  }
}

export class BaseTransaction extends AbstractBaseTx implements Signable {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string) {
    super(0x00000000, networkId, blockchainId, outputs, inputs, memo)
  }

  getUnsignedInputs (): TransferableInput[] {
    return this.inputs
  }
}
