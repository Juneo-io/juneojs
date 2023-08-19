import { type Blockchain } from '../chain'
import { EVMTransactionStatus, EVMTransactionStatusFetcher, type FeeData } from '../transaction'
import { type JEVMAPI } from '../api'
import { TransactionReceipt, type TransactionType, WalletStatusFetcherDelay, WalletStatusFetcherMaxAttempts } from './common'

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
    const transactionStatus: string = await new EVMTransactionStatusFetcher(api,
      WalletStatusFetcherDelay, WalletStatusFetcherMaxAttempts, transactionHash)
      .fetch()
      .catch(error => {
        this.status = MCNOperationStatus.Error
        throw error
      })
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === EVMTransactionStatus.Failure) {
      this.status = MCNOperationStatus.Error
    } else {
      this.status = MCNOperationStatus.Timeout
    }
    return transactionStatus === EVMTransactionStatus.Success
  }
}

export enum MCNOperationStatus {
  Initializing = 'Initializing',
  Executing = 'Executing',
  Done = 'Done',
  Timeout = 'Timeout',
  Error = 'Error'
}
