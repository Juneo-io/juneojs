import { type JVMAPI } from '../../api'
import { type Blockchain, type JVMBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import {
  type Utxo, fetchUtxos, type UnsignedTransaction, buildJVMBaseTransaction, UserInput,
  buildJVMExportTransaction, buildJVMImportTransaction
} from '../../transaction'
import { getUtxosAmountValues, getImportUserInputs } from '../../utils'
import { type JVMAccount } from '../account'
import { ChainOperationSummary } from '../operation'
import { type SendOperation } from '../send'
import { type MCNWallet } from '../wallet'
import { BaseFeeData, type FeeData, FeeType, UtxoFeeData } from './fee'
import { BaseSpending, UtxoSpending } from './transaction'

async function getJVMBaseTxFee (provider: MCNProvider, type: FeeType): Promise<BaseFeeData> {
  return new BaseFeeData(provider.jvm.chain, BigInt((await provider.info.getTxFee()).txFee), type)
}

export async function estimateJVMBaseTransaction (provider: MCNProvider, wallet: MCNWallet, assetId: string, amount: bigint, address: string, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
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

export async function estimateJVMSendOperation (provider: MCNProvider, wallet: MCNWallet, send: SendOperation, account: JVMAccount): Promise<ChainOperationSummary> {
  const chain: JVMBlockchain = provider.jvm.chain
  return await estimateJVMBaseTransaction(provider, wallet, send.assetId, send.amount, send.address, account.utxoSet).then(fee => {
    return new ChainOperationSummary(send, chain, fee, [new UtxoSpending(chain, send.amount, send.assetId, fee.transaction.getUtxos()), fee.getAsSpending()])
  }, async () => {
    const fee: BaseFeeData = await getJVMBaseTxFee(provider, FeeType.BaseFee)
    return new ChainOperationSummary(send, chain, fee, [new BaseSpending(chain, send.amount, send.assetId), fee.getAsSpending()])
  })
}

export async function estimateJVMExportTransaction (provider: MCNProvider): Promise<BaseFeeData> {
  return await getJVMBaseTxFee(provider, FeeType.ExportFee)
}

export async function sendJVMExportTransaction (
  provider: MCNProvider, wallet: MCNWallet, destination: Blockchain, assetId: string, amount: bigint, address: string,
  sendImportFee: boolean, importFee: bigint, fee?: FeeData, utxoSet?: Utxo[], extraFeeAmount: bigint = BigInt(0)
): Promise<string> {
  const api: JVMAPI = provider.jvm
  const sender: string = wallet.getAddress(api.chain)
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [sender])
  }
  if (typeof fee === 'undefined') {
    fee = await estimateJVMExportTransaction(provider)
  }
  const inputs: UserInput[] = [new UserInput(assetId, api.chain, amount, address, destination)]
  if (extraFeeAmount > BigInt(0)) {
    inputs.push(new UserInput(destination.assetId, api.chain, extraFeeAmount, address, destination))
  }
  const exportAddress: string = wallet.getWallet(destination).getJuneoAddress()
  const transaction: UnsignedTransaction = buildJVMExportTransaction(inputs, utxoSet, [sender], exportAddress,
    fee.amount, sendImportFee ? importFee : BigInt(0), sender, provider.mcn.id, api.chain.id
  )
  return (await api.issueTx(transaction.signTransaction([wallet.getWallet(api.chain)]).toCHex())).txID
}

export async function estimateJVMImportTransaction (provider: MCNProvider): Promise<BaseFeeData> {
  return await getJVMBaseTxFee(provider, FeeType.ImportFee)
}

export async function sendJVMImportTransaction (
  provider: MCNProvider, wallet: MCNWallet, source: Blockchain, payImportFee: boolean, fee?: FeeData, utxoSet?: Utxo[]
): Promise<string> {
  const api: JVMAPI = provider.jvm
  const sender: string = wallet.getAddress(api.chain)
  const fetchUtxoSet: boolean = typeof utxoSet === 'undefined'
  if (typeof utxoSet === 'undefined') {
    // put import utxos first to priorize usage of imported inputs
    utxoSet = await fetchUtxos(api, [sender], source.id)
  }
  const values: Map<string, bigint> = getUtxosAmountValues(utxoSet)
  if (fetchUtxoSet && payImportFee) {
    // also fetching utxos in chain that could be needed if import fee
    // was expected to be paid in destination chain during export
    utxoSet = utxoSet.concat(await fetchUtxos(api, [sender]))
  }
  if (typeof fee === 'undefined') {
    fee = await estimateJVMImportTransaction(provider)
  }
  const inputs: UserInput[] = getImportUserInputs(values, fee.assetId, fee.amount, source, api.chain, sender)
  const transaction: UnsignedTransaction = buildJVMImportTransaction(inputs, utxoSet, [sender], fee.amount, sender, provider.mcn.id)
  return (await api.issueTx(transaction.signTransaction([wallet.getWallet(api.chain)]).toCHex())).txID
}
