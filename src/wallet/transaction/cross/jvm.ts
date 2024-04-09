import { type JVMAPI } from '../../../api'
import { type Blockchain } from '../../../chain'
import { type MCNProvider } from '../../../juneo'
import {
  type Utxo,
  UserInput,
  type UnsignedTransaction,
  buildJVMExportTransaction,
  buildJVMImportTransaction
} from '../../../transaction'
import { getUtxosAmountValues, getImportUserInputs } from '../../../utils'
import { type MCNWallet } from '../../wallet'
import { BaseFeeData, type FeeData, FeeType } from '../fee'

export async function estimateJVMExportTransaction (provider: MCNProvider): Promise<BaseFeeData> {
  return new BaseFeeData(provider.jvmChain, BigInt((await provider.info.getTxFee()).txFee), FeeType.ExportFee)
}

export async function executeJVMExportTransaction (
  provider: MCNProvider,
  wallet: MCNWallet,
  destination: Blockchain,
  assetId: string,
  amount: bigint,
  address: string,
  sendImportFee: boolean,
  importFee: bigint,
  fee: FeeData,
  utxoSet: Utxo[],
  extraFeeAmount: bigint = BigInt(0)
): Promise<string> {
  const api: JVMAPI = provider.jvmApi
  const sender: string = wallet.getAddress(api.chain)
  const inputs: UserInput[] = [new UserInput(assetId, api.chain, amount, [address], 1, destination)]
  if (extraFeeAmount > BigInt(0)) {
    inputs.push(new UserInput(destination.assetId, api.chain, extraFeeAmount, [address], 1, destination))
  }
  const exportAddress: string = wallet.getWallet(destination).getJuneoAddress()
  const transaction: UnsignedTransaction = buildJVMExportTransaction(
    inputs,
    utxoSet,
    [sender],
    exportAddress,
    fee.amount,
    sendImportFee ? importFee : BigInt(0),
    sender,
    provider.mcn.id,
    api.chain.id
  )
  return (await api.issueTx(transaction.signTransaction([wallet.getWallet(api.chain)]).toCHex())).txID
}

export async function estimateJVMImportTransaction (provider: MCNProvider): Promise<BaseFeeData> {
  return new BaseFeeData(provider.jvmChain, BigInt((await provider.info.getTxFee()).txFee), FeeType.ImportFee)
}

export async function executeJVMImportTransaction (
  provider: MCNProvider,
  wallet: MCNWallet,
  source: Blockchain,
  fee: FeeData,
  utxoSet: Utxo[]
): Promise<string> {
  const api: JVMAPI = provider.jvmApi
  const sender: string = wallet.getAddress(api.chain)
  const values: Map<string, bigint> = getUtxosAmountValues(utxoSet, source.id)
  const inputs: UserInput[] = getImportUserInputs(values, fee.assetId, fee.amount, source, api.chain, sender)
  const transaction: UnsignedTransaction = buildJVMImportTransaction(
    inputs,
    utxoSet,
    [sender],
    fee.amount,
    sender,
    provider.mcn.id
  )
  return (await api.issueTx(transaction.signTransaction([wallet.getWallet(api.chain)]).toCHex())).txID
}
