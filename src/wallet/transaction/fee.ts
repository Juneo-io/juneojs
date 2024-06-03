import { type TokenAsset } from '../../asset'
import { type JEVMBlockchain, type Blockchain } from '../../chain'
import { type UnsignedTransaction } from '../../transaction'
import { type AssetValue } from '../../utils'
import { BaseSpending, type EVMTransactionData, UtxoSpending, type Spending } from './transaction'

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
  CreateSupernet = 'Create supernet fee',
  RemoveSupernetValidator = 'Remove supernet validator fee',
  CreateChain = 'Create chain fee',
  EthCall = 'Eth call fee',
}

export interface FeeData {
  chain: Blockchain
  amount: bigint
  type: string
  assetId: string
  spending: Spending

  getAssetValue: () => AssetValue
}

export class BaseFeeData implements FeeData {
  chain: Blockchain
  asset: TokenAsset
  amount: bigint
  type: string
  assetId: string
  spending: BaseSpending

  constructor (chain: Blockchain, amount: bigint, type: string) {
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

  constructor (chain: Blockchain, amount: bigint, type: string, transaction: UnsignedTransaction) {
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
    type: string,
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
    this.amount = this.baseFee * this.gasLimit
    this.gasLimit = gasLimit
  }
}
