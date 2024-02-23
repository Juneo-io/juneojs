import { type JVMAPI } from '../api'
import { type UtxoFeeData, estimateJVMBaseTransaction } from './transaction'
import { type JVMAccount, type MCNProvider } from '../juneo'

export class SendManager {
  private readonly provider: MCNProvider

  constructor (provider: MCNProvider) {
    this.provider = provider
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
