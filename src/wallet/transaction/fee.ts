import { type Blockchain, type AssetValue } from '../../chain'
import { type UnsignedTransaction } from '../../transaction'
import { type Spending, UtxoSpending } from './transaction'

export enum FeeType {
  Undefined = 'Undefined',
  BaseFee = 'Base fee',
  ExportFee = 'Export fee',
  ImportFee = 'Import fee',
  Wrap = 'Wrap fee',
  Unwrap = 'Unwrap fee',
  Withdraw = 'Withdraw fee',
  Deposit = 'Deposit fee',
  ValidateFee = 'Validate fee',
  DelegateFee = 'Delegate fee'
}

export interface FeeData {
  chain: Blockchain
  type: string
  amount: bigint
  getAssetValue: () => AssetValue
}

export class BaseFeeData implements FeeData, Spending {
  chain: Blockchain
  type: string
  chainId: string
  amount: bigint
  assetId: string

  constructor (chain: Blockchain, amount: bigint, type: string) {
    this.chain = chain
    this.type = type
    this.chainId = chain.id
    this.amount = amount
    this.assetId = chain.assetId
  }

  getAssetValue (): AssetValue {
    return this.chain.asset.getAssetValue(this.amount)
  }
}

export class UtxoFeeData extends UtxoSpending implements FeeData {
  chain: Blockchain
  type: string
  transaction: UnsignedTransaction

  constructor (chain: Blockchain, amount: bigint, type: string, transaction: UnsignedTransaction) {
    super(chain.id, amount, chain.assetId, transaction.getUtxos())
    this.chain = chain
    this.type = type
    this.transaction = transaction
  }

  getAssetValue (): AssetValue {
    return this.chain.asset.getAssetValue(this.amount)
  }
}
