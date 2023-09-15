import { type ethers } from 'ethers'
import { type JEVMAPI } from '../api'
import { type JEVMWallet, type MCNWallet } from './wallet'
import { type JEVMBlockchain, type WrappedAsset } from '../chain'
import { type EVMFeeData, FeeType, estimateEVMTransaction, sendEVMTransaction } from './transaction'
import { type NetworkOperation, NetworkOperationType } from './operation'
import { type MCNProvider } from '../juneo'

export class WrapManager {
  private readonly api: JEVMAPI
  private readonly wallet: ethers.Wallet

  constructor (api: JEVMAPI, wallet: JEVMWallet) {
    this.api = api
    this.wallet = wallet.evmWallet.connect(api.chain.ethProvider)
  }

  static from (provider: MCNProvider, wallet: MCNWallet, chain: JEVMBlockchain): WrapManager {
    const api: JEVMAPI = provider.jevm[chain.id]
    return new WrapManager(api, wallet.getEthWallet(chain))
  }

  async estimateWrapFee (asset: WrappedAsset, amount: bigint): Promise<EVMFeeData> {
    return await estimateEVMTransaction(
      this.api, asset.assetId, this.wallet.address, asset.address, BigInt(amount), asset.adapter.getDepositData(), FeeType.Wrap
    )
  }

  async estimateUnwrapFee (asset: WrappedAsset, amount: bigint): Promise<EVMFeeData> {
    return await estimateEVMTransaction(
      this.api, asset.assetId, this.wallet.address, asset.address, BigInt(0), asset.adapter.getWithdrawData(amount), FeeType.Unwrap
    )
  }

  async wrap (asset: WrappedAsset, amount: bigint, feeData?: EVMFeeData): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateWrapFee(asset, amount)
    }
    return await sendEVMTransaction(this.api, this.wallet, feeData)
  }

  async unwrap (asset: WrappedAsset, amount: bigint, feeData?: EVMFeeData): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateUnwrapFee(asset, amount)
    }
    return await sendEVMTransaction(this.api, this.wallet, feeData)
  }
}

abstract class Wrapping implements NetworkOperation {
  type: NetworkOperationType
  asset: WrappedAsset
  amount: bigint

  constructor (type: NetworkOperationType, asset: WrappedAsset, amount: bigint) {
    this.type = type
    this.asset = asset
    this.amount = amount
  }
}

export class WrapOperation extends Wrapping {
  constructor (asset: WrappedAsset, amount: bigint) {
    super(NetworkOperationType.Wrap, asset, amount)
  }
}

export class UnwrapOperation extends Wrapping {
  constructor (asset: WrappedAsset, amount: bigint) {
    super(NetworkOperationType.Unwrap, asset, amount)
  }
}
