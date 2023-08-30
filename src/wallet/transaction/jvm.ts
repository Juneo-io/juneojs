import { type JVMAPI } from '../../api'
import { type JVMBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { type Utxo, fetchUtxos, type UnsignedTransaction, buildJVMBaseTransaction, UserInput } from '../../transaction'
import { type JVMAccount } from '../account'
import { MCNOperationSummary } from '../operation'
import { type SendOperation } from '../send'
import { type JuneoWallet } from '../wallet'
import { BaseFeeData, FeeType, UtxoFeeData } from './fee'
import { BaseSpending, UtxoSpending } from './transaction'

async function getJVMBaseTxFee (provider: MCNProvider): Promise<BaseFeeData> {
  return new BaseFeeData(provider.jvm.chain, BigInt((await provider.info.getTxFee()).txFee), FeeType.BaseFee)
}

export async function estimateJVMBaseTransaction (provider: MCNProvider, wallet: JuneoWallet, assetId: string, amount: bigint, address: string, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
  const api: JVMAPI = provider.jvm
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [wallet.getAddress(api.chain)])
  }
  const fee: BaseFeeData = await getJVMBaseTxFee(provider)
  const transaction: UnsignedTransaction = buildJVMBaseTransaction([new UserInput(assetId, api.chain, amount, address, api.chain)],
    utxoSet, [wallet.getAddress(api.chain)], fee.amount, wallet.getAddress(api.chain), provider.mcn.id, api.chain.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimateJVMSendOperation (provider: MCNProvider, wallet: JuneoWallet, send: SendOperation, account: JVMAccount): Promise<MCNOperationSummary> {
  const chain: JVMBlockchain = provider.jvm.chain
  return await estimateJVMBaseTransaction(provider, wallet, send.assetId, send.amount, send.address, account.utxoSet).then(fee => {
    return new MCNOperationSummary(send, chain, [fee], [new UtxoSpending(chain.id, send.amount, send.assetId, fee.transaction.getUtxos()), fee])
  }, async () => {
    const fee: BaseFeeData = await getJVMBaseTxFee(provider)
    return new MCNOperationSummary(send, chain, [fee], [new BaseSpending(chain.id, send.amount, send.assetId), fee])
  })
}
