import { type TokenAsset } from '../../asset'
import { type Blockchain, type JEVMBlockchain } from '../../chain'
import { type UnsignedTransaction } from '../../transaction'
import { type AssetValue } from '../../utils'
import { BaseSpending, type TransactionType, UtxoSpending, type EVMTransactionData, type Spending } from './transaction'

export interface FeeData {
  chain: Blockchain
  amount: bigint
  type: TransactionType
  assetId: string
  spending: Spending

  getAssetValue: () => AssetValue
}

export class BaseFeeData implements FeeData {
  chain: Blockchain
  asset: TokenAsset
  amount: bigint
  type: TransactionType
  assetId: string
  spending: BaseSpending

  constructor (chain: Blockchain, amount: bigint, type: TransactionType) {
    this.chain = chain
    this.asset = chain.asset
    this.amount = amount
    this.type = type
    this.assetId = chain.assetId
    this.spending = new BaseSpending(this.chain, this.amount, this.assetId)
  }

  getAssetValue (): AssetValue {
    return this.asset.getAssetValue(this.amount)
  }
}

export class UtxoFeeData extends BaseFeeData {
  transaction: UnsignedTransaction
  override spending: UtxoSpending

  constructor (chain: Blockchain, amount: bigint, type: TransactionType, transaction: UnsignedTransaction) {
    super(chain, amount, type)
    this.transaction = transaction
    this.spending = new UtxoSpending(this.chain, this.amount, this.assetId, this.transaction.getUtxos())
  }

  getAssetValue (): AssetValue {
    return this.chain.asset.getAssetValue(this.amount)
  }
}

export class EVMFeeData extends BaseFeeData {
  baseFee: bigint
  gasLimit: bigint
  data: EVMTransactionData

  constructor (
    chain: JEVMBlockchain,
    amount: bigint,
    type: TransactionType,
    baseFee: bigint,
    gasLimit: bigint,
    data: EVMTransactionData
  ) {
    super(chain, amount, type)
    this.baseFee = baseFee
    this.gasLimit = gasLimit
    this.data = data
  }

  setGasLimit (gasLimit: bigint): void {
    this.amount = this.baseFee * gasLimit
    this.spending.amount = this.amount
    this.gasLimit = gasLimit
  }
}
