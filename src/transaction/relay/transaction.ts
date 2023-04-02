import { type RelayAPI } from '../../api/relay'
import { sleep } from '../../utils/time'
import { type TransferableInput } from '../input'
import { type TransferableOutput } from '../output'
import { AbstractExportTransaction, AbstractImportTransaction } from '../transaction'
import { type BlockchainId } from '../types'

const ExportTransactionTypeId: number = 0x00000012
const ImportTransactionTypeId: number = 0x00000011

export enum RelayTransactionStatus {
  Committed = 'Committed',
  Aborted = 'Aborted',
  Processing = 'Processing',
  Dropped = 'Dropped',
  Unknown = 'Unknown'
}

export class RelayTransactionStatusFetcher {
  relayApi: RelayAPI
  delay: number
  private attempts: number = 0
  maxAttempts: number
  transactionId: string
  currentStatus: string = RelayTransactionStatus.Unknown

  constructor (relayApi: RelayAPI, delay: number, maxAttempts: number, transactionId: string) {
    this.relayApi = relayApi
    this.delay = delay
    this.maxAttempts = maxAttempts
    this.transactionId = transactionId
  }

  getAttemptsCount (): number {
    return this.attempts
  }

  async fetch (): Promise<string> {
    while (this.attempts < this.maxAttempts && this.currentStatus !== RelayTransactionStatus.Committed) {
      this.currentStatus = (await this.relayApi.getTxStatus(this.transactionId)).status
      await sleep(this.delay)
      this.attempts += 1
    }
    return this.currentStatus
  }
}

export class RelayExportTransaction extends AbstractExportTransaction {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    destinationChain: BlockchainId, exportedOutputs: TransferableOutput[]) {
    super(ExportTransactionTypeId, networkId, blockchainId, outputs,
      inputs, memo, destinationChain, exportedOutputs)
  }
}

export class RelayImportTransaction extends AbstractImportTransaction {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    sourceChain: BlockchainId, importedInputs: TransferableInput[]) {
    super(ImportTransactionTypeId, networkId, blockchainId, outputs,
      inputs, memo, sourceChain, importedInputs)
  }
}
