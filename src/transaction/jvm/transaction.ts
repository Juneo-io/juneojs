import { type JVMAPI } from '../../api/jvm'
import { sleep } from '../../utils'
import { type TransferableInput } from '../input'
import { type TransferableOutput } from '../output'
import { type Signable } from '../signature'
import { AbstractBaseTransaction, AbstractExportTransaction, AbstractImportTransaction } from '../transaction'
import { type BlockchainId } from '../types'

const BaseTransactionTypeId: number = 0x00000000
const ExportTransactionTypeId: number = 0x00000004
const ImportTransactionTypeId: number = 0x00000003

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
    while (this.attempts < this.maxAttempts && !this.isCurrentStatusSettled()) {
      await sleep(this.delay)
      this.currentStatus = (await this.jvmApi.getTxStatus(this.transactionId)).status
      this.attempts += 1
    }
    return this.currentStatus
  }

  private isCurrentStatusSettled (): boolean {
    return this.currentStatus !== JVMTransactionStatus.Unknown && this.currentStatus !== JVMTransactionStatus.Processing
  }
}

export class BaseTransaction extends AbstractBaseTransaction {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string) {
    super(BaseTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
  }

  getSignables (): Signable[] {
    return this.inputs
  }
}

export class JVMExportTransaction extends AbstractExportTransaction {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    destinationChain: BlockchainId, exportedOutputs: TransferableOutput[]) {
    super(ExportTransactionTypeId, networkId, blockchainId, outputs,
      inputs, memo, destinationChain, exportedOutputs)
  }
}

export class JVMImportTransaction extends AbstractImportTransaction {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    sourceChain: BlockchainId, importedInputs: TransferableInput[]) {
    super(ImportTransactionTypeId, networkId, blockchainId, outputs,
      inputs, memo, sourceChain, importedInputs)
  }
}
