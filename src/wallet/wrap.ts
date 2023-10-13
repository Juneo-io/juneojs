import { type ethers } from 'ethers'
import { type JEVMAPI } from '../api'
import { type MCNWallet } from './wallet'
import { type JEVMBlockchain } from '../chain'
import { type EVMFeeData, FeeType, estimateEVMCall, sendEVMTransaction } from './transaction'
import { type WrappedAsset } from '../asset'
import { type MCNProvider } from '../juneo'
import { AmountError } from '../utils'

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
    if (amount < BigInt(1)) {
      throw new AmountError(`cannot wrap zero or negative amount got: ${amount}`)
    }
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateWrapFee(asset, amount)
    }
    return await sendEVMTransaction(this.api, this.wallet, feeData)
  }

  async unwrap (asset: WrappedAsset, amount: bigint, feeData?: EVMFeeData): Promise<string> {
    if (amount < BigInt(1)) {
      throw new AmountError(`cannot unwrap zero or negative amount got: ${amount}`)
    }
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateUnwrapFee(asset, amount)
    }
    return await sendEVMTransaction(this.api, this.wallet, feeData)
  }
}
