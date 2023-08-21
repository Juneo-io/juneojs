import { type ethers } from 'ethers'
import { type JEVMAPI } from '../api'
import { type JEVMWallet, type JuneoWallet } from './wallet'
import { type JEVMBlockchain, type WrappedAsset } from '../chain'
import { FeeType } from '../transaction'
import { EVMTransactionData, estimateEVMTransaction, sendEVMTransaction } from './common'
import { type MCNOperation, MCNOperationType } from './operation'
import { type EVMFeeData } from './fee'
import { type MCNProvider } from '../juneo'

export class WrapManager {
  private readonly api: JEVMAPI
  private readonly wallet: ethers.Wallet

  constructor (api: JEVMAPI, wallet: JEVMWallet) {
    this.api = api
    this.wallet = wallet.evmWallet.connect(api.chain.ethProvider)
  }

  static from (provider: MCNProvider, wallet: JuneoWallet, chain: JEVMBlockchain): WrapManager {
    const api: JEVMAPI = provider.jevm[chain.id]
    return new WrapManager(api, wallet.getEthWallet(chain))
  }

  async estimateWrapFee (asset: WrappedAsset, amount: bigint): Promise<EVMFeeData> {
    return await estimateEVMTransaction(
      this.api, this.wallet.address, asset.address, BigInt(amount), asset.adapter.getDepositData(), FeeType.Wrap
    )
  }

  async estimateUnwrapFee (asset: WrappedAsset, amount: bigint): Promise<EVMFeeData> {
    return await estimateEVMTransaction(
      this.api, this.wallet.address, asset.address, BigInt(0), asset.adapter.getWithdrawData(amount), FeeType.Unwrap
    )
  }

  async wrap (asset: WrappedAsset, amount: bigint, feeData?: EVMFeeData): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateWrapFee(asset, amount)
    }
    const transactionData: EVMTransactionData = new EVMTransactionData(
      asset.address, amount, feeData, asset.adapter.getDepositData()
    )
    return await sendEVMTransaction(this.api, this.wallet, transactionData)
  }

  async unwrap (asset: WrappedAsset, amount: bigint, feeData?: EVMFeeData): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateUnwrapFee(asset, amount)
    }
    const transactionData: EVMTransactionData = new EVMTransactionData(
      asset.address, BigInt(0), feeData, asset.adapter.getWithdrawData(amount)
    )
    return await sendEVMTransaction(this.api, this.wallet, transactionData)
  }
}

abstract class Wrapping implements MCNOperation {
  type: MCNOperationType
  asset: WrappedAsset
  amount: bigint

  constructor (type: MCNOperationType, asset: WrappedAsset, amount: bigint) {
    this.type = type
    this.asset = asset
    this.amount = amount
  }
}

export class WrapOperation extends Wrapping {
  constructor (asset: WrappedAsset, amount: bigint) {
    super(MCNOperationType.Wrap, asset, amount)
  }
}

export class UnwrapOperation extends Wrapping {
  constructor (asset: WrappedAsset, amount: bigint) {
    super(MCNOperationType.Unwrap, asset, amount)
  }
}
