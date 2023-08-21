import { type Blockchain } from '../chain'
import { EVMTransactionStatus, EVMTransactionStatusFetcher, PlatformTransactionStatusFetcher, type FeeData, PlatformTransactionStatus } from '../transaction'
import { type PlatformAPI, type JEVMAPI } from '../api'
import { TransactionReceipt, type TransactionType, WalletStatusFetcherTimeout } from './common'

export enum MCNOperationType {
  Transfer = 'Base transfer',
  Cross = 'Cross chain transfer',
  Bridge = 'Bridge transfer',
  Validate = 'Validate',
  Delegate = 'Delegate',
  Wrap = 'Wrap',
  Unwrap = 'Unwrap',
  Unsupported = 'Unsupported operation'
}

export interface MCNOperation {
  type: MCNOperationType
}

export class MCNOperationSummary {
  operation: MCNOperation
  chain: Blockchain
  fees: FeeData[]

  constructor (operation: MCNOperation, chain: Blockchain, fees: FeeData[]) {
    this.operation = operation
    this.chain = chain
    this.fees = fees
  }
}

export class ExecutableMCNOperation {
  summary: MCNOperationSummary
  status: MCNOperationStatus = MCNOperationStatus.Initializing
  receipts: TransactionReceipt[] = []

  constructor (summary: MCNOperationSummary) {
    this.summary = summary
  }

  async addTrackedEVMTransaction (api: JEVMAPI, type: TransactionType, transactionHash: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, type)
    this.receipts.push(receipt)
    receipt.transactionId = transactionHash
    receipt.transactionStatus = EVMTransactionStatus.Unknown
    const transactionStatus: string = await new EVMTransactionStatusFetcher(api, transactionHash)
      .fetch(WalletStatusFetcherTimeout)
      .catch(error => {
        this.status = MCNOperationStatus.Error
        throw error
      })
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === EVMTransactionStatus.Failure) {
      this.status = MCNOperationStatus.Error
    } else if (transactionStatus !== EVMTransactionStatus.Success) {
      this.status = MCNOperationStatus.Timeout
    }
    return transactionStatus === EVMTransactionStatus.Success
  }

  async addTrackedPlatformTransaction (api: PlatformAPI, type: TransactionType, transactionId: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, type)
    this.receipts.push(receipt)
    receipt.transactionId = transactionId
    receipt.transactionStatus = PlatformTransactionStatus.Unknown
    const transactionStatus: string = await new PlatformTransactionStatusFetcher(api, transactionId)
      .fetch(WalletStatusFetcherTimeout)
      .catch(error => {
        this.status = MCNOperationStatus.Error
        throw error
      })
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === PlatformTransactionStatus.Dropped || transactionStatus === PlatformTransactionStatus.Aborted) {
      this.status = MCNOperationStatus.Error
    } else if (transactionStatus !== PlatformTransactionStatus.Committed) {
      this.status = MCNOperationStatus.Timeout
    }
    return transactionStatus === PlatformTransactionStatus.Committed
  }
}

export enum MCNOperationStatus {
  Initializing = 'Initializing',
  Executing = 'Executing',
  Done = 'Done',
  Timeout = 'Timeout',
  Error = 'Error'
}
