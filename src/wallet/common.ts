import { type Blockchain } from '../chain'
import { type FeeData } from '../transaction'
import { type TransactionReceipt } from './transfer'

export const WalletStatusFetcherDelay: number = 100
export const WalletStatusFetcherMaxAttempts: number = 600

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
  type: string
  chain: Blockchain
  fees: FeeData[]

  constructor (type: string, chain: Blockchain, fees: FeeData[]) {
    this.type = type
    this.chain = chain
    this.fees = fees
  }
}

export class ExecutableMCNOperation {
  operation: MCNOperation
  summary: MCNOperationSummary
  status: MCNOperationStatus = MCNOperationStatus.Initializing
  receipts: TransactionReceipt[] = []

  constructor (operation: MCNOperation, summary: MCNOperationSummary) {
    this.operation = operation
    this.summary = summary
  }
}

export enum MCNOperationStatus {
  Initializing = 'Initializing',
  Executing = 'Executing',
  Done = 'Done',
  Timeout = 'Timeout',
  Error = 'Error'
}
