import { type ethers } from 'ethers'
import { type JEVMAPI } from '../api'
import { type MCNWallet } from './wallet'
import { type JEVMBlockchain, type WrappedAsset } from '../chain'
import { type EVMFeeData, FeeType, estimateEVMCall, sendEVMTransaction } from './transaction'
import { type MCNProvider } from '../juneo'

export class WrapManager {
  private readonly api: JEVMAPI
  private readonly wallet: ethers.Wallet

  constructor (api: JEVMAPI, wallet: ethers.Wallet) {
    this.api = api
    this.wallet = wallet
  }

  static from (provider: MCNProvider, wallet: MCNWallet, chain: JEVMBlockchain): WrapManager {
    const api: JEVMAPI = provider.jevm[chain.id]
    return new WrapManager(api, wallet.getJEVMWallet(api.chain).evmWallet)
  }

  async estimateWrapFee (asset: WrappedAsset, amount: bigint): Promise<EVMFeeData> {
    return await estimateEVMCall(
      this.api,
      this.wallet.address,
      asset.address,
      BigInt(amount),
      asset.adapter.getDepositData(),
      FeeType.Wrap
    )
  }

  async estimateUnwrapFee (asset: WrappedAsset, amount: bigint): Promise<EVMFeeData> {
    return await estimateEVMCall(
      this.api,
      this.wallet.address,
      asset.address,
      BigInt(0),
      asset.adapter.getWithdrawData(amount),
      FeeType.Unwrap
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
