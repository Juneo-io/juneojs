import { type TokenAsset } from '../../asset'
import { type Blockchain } from '../../chain'
import { type UnsignedTransaction } from '../../transaction'
import { type AssetValue } from '../../utils'
import { type Spending, UtxoSpending, BaseSpending } from './transaction'

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
  DelegateFee = 'Delegate fee',
}

export interface FeeData {
  chain: Blockchain
  amount: bigint
  type: string
  assetId: string

  getAssetValue: () => AssetValue

  getAsSpending: () => Spending
}

export class BaseFeeData implements FeeData {
  chain: Blockchain
  asset: TokenAsset
  amount: bigint
  type: string
  assetId: string

  constructor (chain: Blockchain, amount: bigint, type: string) {
    this.chain = chain
    this.asset = chain.asset
    this.amount = amount
    this.type = type
    this.assetId = chain.assetId
  }

  getAssetValue (): AssetValue {
    return this.asset.getAssetValue(this.amount)
  }

  getAsSpending (): Spending {
    return new BaseSpending(this.chain, this.amount, this.assetId)
  }
}

export class UtxoFeeData extends BaseFeeData {
  transaction: UnsignedTransaction

  constructor (chain: Blockchain, amount: bigint, type: string, transaction: UnsignedTransaction) {
    super(chain, amount, type)
    this.transaction = transaction
  }

  getAssetValue (): AssetValue {
    return this.chain.asset.getAssetValue(this.amount)
  }

  override getAsSpending (): UtxoSpending {
    return new UtxoSpending(this.chain, this.amount, this.assetId, this.transaction.getUtxos())
  }
}
