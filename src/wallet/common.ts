import { type Blockchain } from '../chain'
import { type FeeData } from '../transaction'

export const WalletStatusFetcherDelay: number = 100
export const WalletStatusFetcherMaxAttempts: number = 600

export enum MCNOperation {
  Transfer = 'Base transfer',
  Cross = 'Cross chain transfer',
  Bridge = 'Bridge transfer',
  Validate = 'Validate',
  Delegate = 'Delegate',
  Wrap = 'Wrap',
  Unwrap = 'Unwrap',
  Unsupported = 'Unsupported operation'
}

export enum MCNOperationStatus {
  Initializing = 'Initializing',
  Executing = 'Executing',
  Done = 'Done',
  Timeout = 'Timeout',
  Error = 'Error'
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
