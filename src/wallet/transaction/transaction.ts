import { type Utxo } from '../../transaction'

export const WalletStatusFetcherTimeout: number = 60000

export enum TransactionType {
  Base = 'Base transaction',
  Send = 'Send transaction',
  Export = 'Export transaction',
  Import = 'Import transaction',
  Withdraw = 'Withdraw transaction',
  Deposit = 'Deposit transaction',
  Wrap = 'Wrap transaction',
  Unwrap = 'Unwrap transaction',
  PrimaryValidation = 'Primary validation',
  PrimaryDelegation = 'Primary delegation',
}

export class TransactionReceipt {
  chainId: string
  transactionType: string
  transactionStatus: string
  transactionId: string

  constructor (chainId: string, transactionType: string, transactionStatus: string, transactionId: string) {
    this.chainId = chainId
    this.transactionStatus = transactionStatus
    this.transactionType = transactionType
    this.transactionId = transactionId
  }
}

export interface Spending {
  chainId: string
  amount: bigint
  assetId: string
}

export class BaseSpending implements Spending {
  chainId: string
  amount: bigint
  assetId: string

  constructor (chainId: string, amount: bigint, assetId: string) {
    this.chainId = chainId
    this.amount = amount
    this.assetId = assetId
  }
}

export class UtxoSpending extends BaseSpending {
  utxos: Utxo[]

  constructor (chainId: string, amount: bigint, assetId: string, utxos: Utxo[]) {
    super(chainId, amount, assetId)
    this.utxos = utxos
  }
}
