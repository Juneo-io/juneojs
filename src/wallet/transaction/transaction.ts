
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
  transactionId: string | undefined
  transactionStatus: string | undefined

  constructor (chainId: string, transactionType: string) {
    this.chainId = chainId
    this.transactionType = transactionType
  }
}

export class Spending {
  chainId: string
  amount: bigint
  assetId: string

  constructor (chainId: string, amount: bigint, assetId: string) {
    this.chainId = chainId
    this.amount = amount
    this.assetId = assetId
  }
}
