import { type JEVMAPI } from '../../../api'
import { type Blockchain } from '../../../chain'
import { type MCNProvider } from '../../../juneo'
import {
  type JEVMExportTransaction,
  type JEVMImportTransaction,
  UserInput,
  type Utxo,
  buildJEVMExportTransaction,
  buildJEVMImportTransaction
} from '../../../transaction'
import {
  AtomicDenomination,
  TimeUtils,
  TransactionError,
  calculateAtomicCost,
  estimateAtomicExportGas,
  estimateAtomicImportGas,
  getImportUserInputs,
  getUtxosAmountValues
} from '../../../utils'
import { type JEVMWallet, type MCNWallet, type VMWallet } from '../../wallet'
import { InvalidNonceRetryDelay, MaxInvalidNonceAttempts } from '../constants'
import { estimateEVMBaseFee, getWalletNonce } from '../evm'
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
  // fee is also gas token
  const feeAmount: bigint = fee.amount / AtomicDenomination
  const exportAddress: string = wallet.getWallet(destination).getJuneoAddress()
  const evmWallet: JEVMWallet = wallet.getJEVMWallet(api.chain)
  let nonce: bigint = await getWalletNonce(evmWallet, api, false)
  for (let i = 0; i < MaxInvalidNonceAttempts; i++) {
    const unsignedTransaction: JEVMExportTransaction = buildJEVMExportTransaction(
      [new UserInput(assetId, api.chain, amount, [address], 1, destination)],
      wallet.getAddress(api.chain),
      nonce,
      exportAddress,
      feeAmount,
      sendImportFee ? importFee : BigInt(0),
      provider.mcn.id
    )
    const transaction: string = unsignedTransaction.signTransaction([wallet.getWallet(api.chain)]).toCHex()
    const transactionId: string | undefined = await api
      .issueTx(transaction)
      .then((response) => {
        return response.txID
      })
      .catch((error) => {
        const errorMessage: string = error.message as string
        if (errorMessage.includes('nonce') || errorMessage.includes('replacement transaction underpriced')) {
          return undefined
        }
        // Non nonce related error decrement nonce to avoid resyncing later.
        evmWallet.nonce--
        throw error
      })
    if (typeof transactionId === 'string') {
      return transactionId
    }
    await TimeUtils.sleep(InvalidNonceRetryDelay)
    nonce = await getWalletNonce(evmWallet, api, true)
  }
  throw new TransactionError(`could not provide a valid nonce ${evmWallet.nonce}`)
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
  return (await api.issueTx(transaction.signTransaction([chainWallet]).toCHex())).txID
}
