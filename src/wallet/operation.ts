import { type Blockchain } from '../chain'
import {
  EVMTransactionStatus, EVMTransactionStatusFetcher, PlatformTransactionStatusFetcher, PlatformTransactionStatus,
  JVMTransactionStatus, JVMTransactionStatusFetcher, JEVMTransactionStatus, JEVMTransactionStatusFetcher
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
  chains: Blockchain[]
  fees: FeeData[]
  spendings: Spending[]
  private readonly executable: ExecutableMCNOperation

  constructor (operation: MCNOperation, chains: Blockchain[], fees: FeeData[], spendings: Spending[]) {
    this.operation = operation
    this.chains = chains
    this.fees = fees
    this.spendings = spendings
    this.executable = ExecutableMCNOperation.from(this)
  }

  getExecutable (): ExecutableMCNOperation {
    return this.executable
  }
}

export class ExecutableMCNOperation {
  summary: MCNOperationSummary
  status: MCNOperationStatus = MCNOperationStatus.Initializing
  receipts: TransactionReceipt[] = []

  private constructor (summary: MCNOperationSummary) {
    this.summary = summary
  }

  static from (summary: MCNOperationSummary): ExecutableMCNOperation {
    return new ExecutableMCNOperation(summary)
  }

  async addTrackedEVMTransaction (api: JEVMAPI, type: TransactionType, transactionHash: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, type, EVMTransactionStatus.Pending, transactionHash)
    this.receipts.push(receipt)
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

  async addTrackedJEVMTransaction (api: JEVMAPI, type: TransactionType, transactionId: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, type, JEVMTransactionStatus.Processing, transactionId)
    this.receipts.push(receipt)
    const transactionStatus: string = await new JEVMTransactionStatusFetcher(api, transactionId)
      .fetch(WalletStatusFetcherTimeout)
      .catch(error => {
        this.status = MCNOperationStatus.Error
        throw error
      })
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === JEVMTransactionStatus.Dropped) {
      this.status = MCNOperationStatus.Error
    } else if (transactionStatus !== JEVMTransactionStatus.Accepted) {
      this.status = MCNOperationStatus.Timeout
    }
    return transactionStatus === JEVMTransactionStatus.Accepted
  }

  async addTrackedPlatformTransaction (api: PlatformAPI, type: TransactionType, transactionId: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, type, PlatformTransactionStatus.Processing, transactionId)
    this.receipts.push(receipt)
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
    const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, type, JVMTransactionStatus.Processing, transactionId)
    this.receipts.push(receipt)
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
