import { type JEVMAPI, type JVMAPI } from '../api'
import { type JEVMWallet } from './wallet'
import {
  type EVMFeeData,
  estimateEVMTransfer,
  sendEVMTransaction,
  type UtxoFeeData,
  estimateJVMBaseTransaction
} from './transaction'
import { type JVMAccount, type MCNProvider } from '../juneo'

export class SendManager {
  private readonly provider: MCNProvider

  constructor (provider: MCNProvider) {
    this.provider = provider
  }

  async sendEVM (
    wallet: JEVMWallet,
    chainId: string,
    assetId: string,
    amount: bigint,
    address: string,
    feeData?: EVMFeeData
  ): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await estimateEVMTransfer(this.provider, wallet, chainId, assetId, amount, address)
    }
    const api: JEVMAPI = this.provider.jevm[chainId]
    return await sendEVMTransaction(api, wallet, feeData)
  }

  async estimateSendJVM (
    account: JVMAccount,
    assetId: string,
    amount: bigint,
    addresses: string[],
    threshold: number,
    locktime: bigint = BigInt(0)
  ): Promise<UtxoFeeData> {
    return await estimateJVMBaseTransaction(
      this.provider,
      account,
      assetId,
      amount,
      addresses,
      threshold,
      account.utxoSet,
      locktime
    )
  }

  async sendJVM (
    account: JVMAccount,
    assetId: string,
    amount: bigint,
    addresses: string[],
    threshold: number,
    feeData?: UtxoFeeData,
    locktime: bigint = BigInt(0)
  ): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateSendJVM(account, assetId, amount, addresses, threshold, locktime)
    }
    const api: JVMAPI = this.provider.jvm
    const transaction: string = feeData.transaction.signTransaction(account.signers).toCHex()
    return (await api.issueTx(transaction)).txID
  }
}
