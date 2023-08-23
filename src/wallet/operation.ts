import { type Blockchain } from '../chain'
import {
  EVMTransactionStatus, EVMTransactionStatusFetcher, PlatformTransactionStatusFetcher, PlatformTransactionStatus,
  JVMTransactionStatus, JVMTransactionStatusFetcher
} from '../transaction'
import { type PlatformAPI, type JEVMAPI, type JVMAPI } from '../api'
import { type FeeData, TransactionReceipt, type TransactionType, WalletStatusFetcherTimeout, type Spending } from './transaction'

export enum MCNOperationType {
  Send = 'Send',
  Cross = 'Cross',
  Bridge = 'Bridge',
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
  spendings: Spending[]

  constructor (operation: MCNOperation, chain: Blockchain, fees: FeeData[], spendings: Spending[]) {
    this.operation = operation
    this.chain = chain
    this.fees = fees
    this.spendings = spendings
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

  async addTrackedJVMTransaction (api: JVMAPI, type: TransactionType, transactionId: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, type)
    this.receipts.push(receipt)
    receipt.transactionId = transactionId
    receipt.transactionStatus = JVMTransactionStatus.Unknown
    const transactionStatus: string = await new JVMTransactionStatusFetcher(api, transactionId)
      .fetch(WalletStatusFetcherTimeout)
      .catch(error => {
        this.status = MCNOperationStatus.Error
        throw error
      })
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === JVMTransactionStatus.Unknown) {
      this.status = MCNOperationStatus.Error
    } else if (transactionStatus !== JVMTransactionStatus.Accepted) {
      this.status = MCNOperationStatus.Timeout
    }
    return transactionStatus === JVMTransactionStatus.Accepted
  }
}

export enum MCNOperationStatus {
  Initializing = 'Initializing',
  Executing = 'Executing',
  Done = 'Done',
  Timeout = 'Timeout',
  Error = 'Error'
}
