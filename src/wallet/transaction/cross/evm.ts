import { type JEVMAPI } from '../../../api'
import { type Blockchain } from '../../../chain'
import { type MCNProvider } from '../../../juneo'
import {
  type JEVMImportTransaction,
  UserInput,
  type Utxo,
  buildJEVMExportTransaction,
  buildJEVMImportTransaction
} from '../../../transaction'
import {
  AtomicDenomination,
  calculateAtomicCost,
  estimateAtomicExportGas,
  estimateAtomicImportGas,
  getImportUserInputs,
  getUtxosAmountValues
} from '../../../utils'
import { type MCNWallet, type VMWallet } from '../../wallet'
import { estimateEVMBaseFee } from '../evm'
import { BaseFeeData, type FeeData, FeeType } from '../fee'

export async function estimateEVMExportTransaction (
  api: JEVMAPI,
  assetId: string,
  destination: Blockchain
): Promise<BaseFeeData> {
  const gasLimit: bigint = estimateAtomicExportGas(api.chain.assetId, [assetId], destination.assetId)
  const baseFee: bigint = await estimateEVMBaseFee(api)
  // the evm export fee is paid in gas so it must be multiplied by the atomic denominator
  const fee: bigint = calculateAtomicCost(gasLimit, baseFee) * AtomicDenomination
  return new BaseFeeData(api.chain, fee, FeeType.ExportFee)
}

export async function executeEVMExportTransaction (
  provider: MCNProvider,
  api: JEVMAPI,
  wallet: MCNWallet,
  destination: Blockchain,
  assetId: string,
  amount: bigint,
  address: string,
  sendImportFee: boolean,
  importFee: bigint,
  fee: FeeData
): Promise<string> {
  // exportations of the gas token must be divided by atomic denomination
  if (assetId === api.chain.assetId) {
    amount /= AtomicDenomination
  }
  const unsignedTransaction = buildJEVMExportTransaction(
    [new UserInput(assetId, api.chain, amount, [address], 1, destination)],
    wallet.getAddress(api.chain),
    await wallet.getJEVMWallet(api.chain).getNonceAndIncrement(api),
    wallet.getWallet(destination).getJuneoAddress(),
    // fee is also gas token
    fee.amount / AtomicDenomination,
    sendImportFee ? importFee : BigInt(0),
    provider.mcn.id
  )
  const transaction = (await unsignedTransaction.signTransaction([wallet.getWallet(api.chain)])).toCHex()
  return (await api.issueTx(transaction)).txID
}

export async function estimateEVMImportTransaction (
  api: JEVMAPI,
  inputsCount: number,
  outputsCount: number
): Promise<BaseFeeData> {
  const gasLimit: bigint = estimateAtomicImportGas(inputsCount, outputsCount)
  const baseFee: bigint = await estimateEVMBaseFee(api)
  const fee: BaseFeeData = new BaseFeeData(api.chain, calculateAtomicCost(gasLimit, baseFee), FeeType.ImportFee)
  // import fee is paid with utxos from shared memory so using JNT asset
  fee.asset = api.chain.asset.nativeAsset
  return fee
}

export async function executeEVMImportTransaction (
  provider: MCNProvider,
  api: JEVMAPI,
  wallet: MCNWallet,
  source: Blockchain,
  fee: FeeData,
  utxoSet: Utxo[]
): Promise<string> {
  const chainWallet: VMWallet = wallet.getWallet(api.chain)
  const sender: string = chainWallet.getJuneoAddress()
  const values = getUtxosAmountValues(utxoSet, source.id)
  const inputs: UserInput[] = getImportUserInputs(
    values,
    fee.assetId,
    fee.amount,
    source,
    api.chain,
    wallet.getAddress(api.chain)
  )
  const transaction: JEVMImportTransaction = buildJEVMImportTransaction(
    inputs,
    utxoSet,
    [sender],
    fee.amount,
    provider.mcn.id
  )
  const signedTx = await transaction.signTransaction([chainWallet])
  return (await api.issueTx(signedTx.toCHex())).txID
}
