import { type JVMAPI } from '../../api'
import { type Blockchain, type JVMBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import {
  type Utxo, fetchUtxos, type UnsignedTransaction, buildJVMBaseTransaction, UserInput,
  buildJVMExportTransaction, buildJVMImportTransaction
} from '../../transaction'
import { type JVMAccount } from '../account'
import { MCNOperationSummary } from '../operation'
import { type SendOperation } from '../send'
import { type JuneoWallet } from '../wallet'
import { BaseFeeData, type FeeData, FeeType, UtxoFeeData } from './fee'
import { BaseSpending, UtxoSpending } from './transaction'

async function getJVMBaseTxFee (provider: MCNProvider, type: FeeType): Promise<BaseFeeData> {
  return new BaseFeeData(provider.jvm.chain, BigInt((await provider.info.getTxFee()).txFee), type)
}

export async function estimateJVMBaseTransaction (provider: MCNProvider, wallet: JuneoWallet, assetId: string, amount: bigint, address: string, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
  const api: JVMAPI = provider.jvm
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [wallet.getAddress(api.chain)])
  }
  const fee: BaseFeeData = await getJVMBaseTxFee(provider, FeeType.BaseFee)
  const transaction: UnsignedTransaction = buildJVMBaseTransaction([new UserInput(assetId, api.chain, amount, address, api.chain)],
    utxoSet, [wallet.getAddress(api.chain)], fee.amount, wallet.getAddress(api.chain), provider.mcn.id, api.chain.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimateJVMSendOperation (provider: MCNProvider, wallet: JuneoWallet, send: SendOperation, account: JVMAccount): Promise<MCNOperationSummary> {
  const chain: JVMBlockchain = provider.jvm.chain
  return await estimateJVMBaseTransaction(provider, wallet, send.assetId, send.amount, send.address, account.utxoSet).then(fee => {
    return new MCNOperationSummary(send, [chain], [fee], [new UtxoSpending(chain.id, send.amount, send.assetId, fee.transaction.getUtxos()), fee])
  }, async () => {
    const fee: BaseFeeData = await getJVMBaseTxFee(provider, FeeType.BaseFee)
    return new MCNOperationSummary(send, [chain], [fee], [new BaseSpending(chain.id, send.amount, send.assetId), fee])
  })
}

export async function estimateJVMExportTransaction (provider: MCNProvider): Promise<BaseFeeData> {
  return await getJVMBaseTxFee(provider, FeeType.ExportFee)
}

export async function sendJVMExportTransaction (
  provider: MCNProvider, wallet: JuneoWallet, destination: Blockchain, assetId: string, amount: bigint, address: string,
  sendImportFee: boolean, importFee: bigint, fee?: FeeData, utxoSet?: Utxo[]
): Promise<string> {
  const api: JVMAPI = provider.jvm
  const sender: string = wallet.getAddress(api.chain)
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [sender])
  }
  if (typeof fee === 'undefined') {
    fee = await estimateJVMExportTransaction(provider)
  }
  const transaction: UnsignedTransaction = buildJVMExportTransaction([new UserInput(assetId, api.chain, amount, address, destination)],
    utxoSet, [sender], wallet.getAddress(destination), fee.amount, sendImportFee ? importFee : BigInt(0), sender, provider.mcn.id, api.chain.id
  )
  return (await api.issueTx(transaction.signTransaction([wallet.getWallet(api.chain)]).toCHex())).txID
}

export async function estimateJVMImportTransaction (provider: MCNProvider): Promise<BaseFeeData> {
  return await getJVMBaseTxFee(provider, FeeType.ImportFee)
}

export async function sendJVMImportTransaction (
  provider: MCNProvider, wallet: JuneoWallet, source: Blockchain, assetId: string, amount: bigint, address: string, payImportFee: boolean, fee?: FeeData, utxoSet?: Utxo[]
): Promise<string> {
  const api: JVMAPI = provider.jvm
  const sender: string = wallet.getAddress(api.chain)
  if (typeof utxoSet === 'undefined') {
    // put import utxos first to priorize usage of imported inputs
    utxoSet = await fetchUtxos(api, [sender], source.id)
    if (payImportFee) {
      // also fetching utxos in chain that could be needed if import fee
      // was expected to be paid in destination chain during export
      utxoSet = utxoSet.concat(await fetchUtxos(api, [sender]))
    }
  }
  if (typeof fee === 'undefined') {
    fee = await estimateJVMImportTransaction(provider)
  }
  const transaction: UnsignedTransaction = buildJVMImportTransaction([new UserInput(assetId, source, amount, address, api.chain)],
    utxoSet, [sender], fee.amount, sender, provider.mcn.id
  )
  return (await api.issueTx(transaction.signTransaction([wallet.getWallet(api.chain)]).toCHex())).txID
}
