import { type PlatformAPI } from '../../../api'
import { type Blockchain } from '../../../chain'
import { type MCNProvider } from '../../../juneo'
import {
  type Utxo,
  type UnsignedTransaction,
  UserInput,
  buildPlatformImportTransaction,
  buildPlatformExportTransaction
} from '../../../transaction'
import { getImportUserInputs, getUtxosAmountValues } from '../../../utils'
import { type MCNWallet } from '../../wallet'
import { BaseFeeData, type FeeData, FeeType } from '../fee'

export async function estimatePlatformExportTransaction (provider: MCNProvider): Promise<BaseFeeData> {
  return new BaseFeeData(provider.platformChain, BigInt((await provider.info.getTxFee()).txFee), FeeType.ExportFee)
}

export async function executePlatformExportTransaction (
  provider: MCNProvider,
  wallet: MCNWallet,
  destination: Blockchain,
  assetId: string,
  amount: bigint,
  address: string,
  sendImportFee: boolean,
  importFee: bigint,
  fee: FeeData,
  utxoSet: Utxo[]
): Promise<string> {
  const api: PlatformAPI = provider.platformApi
  const sender: string = wallet.getAddress(api.chain)
  const exportAddress: string = wallet.getWallet(destination).getJuneoAddress()
  const transaction: UnsignedTransaction = buildPlatformExportTransaction(
    [new UserInput(assetId, api.chain, amount, [address], 1, destination)],
    utxoSet,
    [sender],
    exportAddress,
    fee.amount,
    sendImportFee ? importFee : BigInt(0),
    sender,
    provider.mcn.id
  )
  return (await api.issueTx(transaction.signTransaction([wallet.getWallet(api.chain)]).toCHex())).txID
}

export async function estimatePlatformImportTransaction (provider: MCNProvider): Promise<BaseFeeData> {
  return new BaseFeeData(provider.platformChain, BigInt((await provider.info.getTxFee()).txFee), FeeType.ImportFee)
}

export async function executePlatformImportTransaction (
  provider: MCNProvider,
  wallet: MCNWallet,
  source: Blockchain,
  fee: FeeData,
  utxoSet: Utxo[]
): Promise<string> {
  const api: PlatformAPI = provider.platformApi
  const sender: string = wallet.getAddress(api.chain)
  const values: Map<string, bigint> = getUtxosAmountValues(utxoSet, source.id)
  const inputs: UserInput[] = getImportUserInputs(values, fee.assetId, fee.amount, source, api.chain, sender)
  const transaction: UnsignedTransaction = buildPlatformImportTransaction(
    inputs,
    utxoSet,
    [sender],
    fee.amount,
    sender,
    provider.mcn.id
  )
  return (await api.issueTx(transaction.signTransaction([wallet.getWallet(api.chain)]).toCHex())).txID
}
