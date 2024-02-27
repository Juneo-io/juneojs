import { type Blockchain } from '../../chain'
import { type Utxo } from '../../transaction'

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
  chain: Blockchain
  amount: bigint
  assetId: string
}

export class BaseSpending implements Spending {
  chain: Blockchain
  amount: bigint
  assetId: string

  constructor (chain: Blockchain, amount: bigint, assetId: string) {
    this.chain = chain
    this.amount = amount
    this.assetId = assetId
  }
}

export class UtxoSpending extends BaseSpending {
  utxos: Utxo[]

  constructor (chain: Blockchain, amount: bigint, assetId: string, utxos: Utxo[]) {
    super(chain, amount, assetId)
    this.utxos = utxos
  }
}
