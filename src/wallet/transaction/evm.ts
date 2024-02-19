import { type ethers } from 'ethers'
import { BaseFeeData, type FeeData, FeeType } from './fee'
import { type JEVMAPI } from '../../api'
import { type Blockchain, type JEVMBlockchain, NativeAssetCallContract, SendEtherGasLimit } from '../../chain'
import { ChainOperationSummary, type UnwrapOperation, type WrapOperation } from '../operation'
import { BaseSpending } from './transaction'
import {
  getUtxosAmountValues,
  getImportUserInputs,
  AtomicDenomination,
  calculateAtomicCost,
  estimateAtomicExportGas,
  estimateAtomicImportGas,
  TransactionError,
  sleep,
  fetchUtxos,
  isContractAddress
} from '../../utils'
import {
  type JEVMExportTransaction,
  type JEVMImportTransaction,
  UserInput,
  type Utxo,
  buildJEVMExportTransaction,
  buildJEVMImportTransaction
} from '../../transaction'
import { type VMWallet, type MCNWallet, type JEVMWallet } from '../wallet'
import { type JRC20Asset } from '../../asset'
import { type MCNProvider } from '../../juneo'

const DefaultWrapEstimate: bigint = BigInt(55_000)
const DefaultUnwrapEstimate: bigint = BigInt(45_000)
const DefaultTransferEstimate: bigint = BigInt(200_000)
const DefaultWithdrawEstimate: bigint = BigInt(100_000)
const DefaultDepositEstimate: bigint = BigInt(100_000)

const MaxInvalidNonceAttempts: number = 5

export class EVMTransactionData {
  from: string
  to: string
  value: bigint
  data: string

  constructor (from: string, to: string, value: bigint, data: string) {
    this.from = from
    this.to = to
    this.value = value
    this.data = data
  }
}

export class EVMFeeData extends BaseFeeData {
  gasPrice: bigint
  gasLimit: bigint
  data: EVMTransactionData

  constructor (
    chain: JEVMBlockchain,
    amount: bigint,
    type: string,
    gasPrice: bigint,
    gasLimit: bigint,
    data: EVMTransactionData
  ) {
    super(chain, amount, type)
    this.gasPrice = gasPrice
    this.gasLimit = gasLimit
    this.data = data
  }
}

export async function getWalletNonce (wallet: JEVMWallet, api: JEVMAPI, synchronize: boolean): Promise<bigint> {
  if (synchronize || !wallet.synchronized) {
    wallet.synchronized = true
    // In the future may set unsync if error occurs in sync process.
    // Verify that it would not negatively impact any other logics before.
    // Not doing it now because of doubt it could fail somewhere else.
    return await api.eth_getTransactionCount(wallet.getAddress(), 'pending')
  }
  return wallet.nonce++
}

export async function estimateEVMGasPrice (api: JEVMAPI): Promise<bigint> {
  return await api.eth_baseFee().catch(() => {
    return api.chain.baseFee
  })
}

export async function estimateEVMCall (
  api: JEVMAPI,
  from: string,
  to: string,
  value: bigint,
  data: string,
  type: FeeType,
  gasPriceAmount?: bigint
): Promise<EVMFeeData> {
  const gasPrice: bigint = typeof gasPriceAmount === 'undefined' ? await estimateEVMGasPrice(api) : gasPriceAmount
  const gasLimit: bigint = await api.chain.ethProvider.estimateGas({
    blockTag: 'pending',
    from,
    to,
    value,
    // TODO Add it as parameter
    // Warning to not use getWalletNonce() as it increments cached nonce.
    // nonce: Number(nonce),
    chainId: api.chain.chainId,
    gasPrice,
    data
  })
  const transactionData: EVMTransactionData = new EVMTransactionData(from, to, value, data)
  return new EVMFeeData(api.chain, gasPrice * gasLimit, type, gasPrice, gasLimit, transactionData)
}

export async function estimateEVMTransfer (
  provider: MCNProvider,
  wallet: JEVMWallet,
  chainId: string,
  assetId: string,
  amount: bigint,
  address: string
): Promise<EVMFeeData> {
  const api: JEVMAPI = provider.jevm[chainId]
  const isContract: boolean = isContractAddress(assetId)
  const from: string = wallet.getAddress()
  const to: string = isContract ? assetId : address
  const value: bigint = isContract ? BigInt(0) : amount
  const data: string = isContract
    ? await api.chain.getContractTransactionData(provider, assetId, address, amount)
    : '0x'
  const type: FeeType = FeeType.BaseFee
  const gasPrice: bigint = await estimateEVMGasPrice(api)
  if (assetId === api.chain.assetId) {
    const gasLimit: bigint = SendEtherGasLimit
    const transactionData: EVMTransactionData = new EVMTransactionData(from, to, value, data)
    return new EVMFeeData(api.chain, gasPrice * gasLimit, type, gasPrice, gasLimit, transactionData)
  }
  return await estimateEVMCall(api, from, to, value, data, type, gasPrice).catch(() => {
    const gasLimit: bigint = DefaultTransferEstimate
    const transactionData: EVMTransactionData = new EVMTransactionData(from, to, value, data)
    return new EVMFeeData(api.chain, gasPrice * gasLimit, type, gasPrice, gasLimit, transactionData)
  })
}

export async function sendEVMTransaction (api: JEVMAPI, wallet: JEVMWallet, feeData: EVMFeeData): Promise<string> {
  const unsignedTransaction: ethers.TransactionRequest = {
    from: wallet.address,
    to: feeData.data.to,
    value: feeData.data.value,
    nonce: Number(await getWalletNonce(wallet, api, false)),
    chainId: api.chain.chainId,
    gasLimit: feeData.gasLimit,
    gasPrice: feeData.gasPrice,
    data: feeData.data.data
  }
  for (let i = 0; i < MaxInvalidNonceAttempts; i++) {
    const transaction: string = await wallet.evmWallet.signTransaction(unsignedTransaction)
    const transactionId: string | undefined = await api.eth_sendRawTransaction(transaction).catch((error) => {
      if ((error.message as string).includes('nonce')) {
        return undefined
      }
      // Non nonce related error decrement nonce to avoid resyncing later.
      wallet.nonce--
      throw error
    })
    if (typeof transactionId === 'string') {
      return transactionId
    }
    await sleep(1000)
    unsignedTransaction.nonce = Number(await getWalletNonce(wallet, api, true))
  }
  throw new TransactionError('could not provide a valid nonce')
}

export async function estimateEVMWrapOperation (
  api: JEVMAPI,
  from: string,
  wrap: WrapOperation
): Promise<ChainOperationSummary> {
  const chain: JEVMBlockchain = api.chain
  const data: string = wrap.asset.adapter.getDepositData()
  const type: FeeType = FeeType.Wrap
  const values = new Map<string, bigint>([[chain.assetId, wrap.amount]])
  return await estimateEVMCall(api, from, wrap.asset.address, wrap.amount, data, type).then(
    (fee) => {
      const spending: BaseSpending = new BaseSpending(chain, wrap.amount, chain.assetId)
      return new ChainOperationSummary(wrap, chain, fee, [spending, fee.spending], values)
    },
    async () => {
      const gasPrice: bigint = await estimateEVMGasPrice(api)
      const fee: BaseFeeData = new BaseFeeData(chain, DefaultWrapEstimate * gasPrice, type)
      const spending: BaseSpending = new BaseSpending(chain, wrap.amount, chain.assetId)
      return new ChainOperationSummary(wrap, chain, fee, [spending, fee.spending], values)
    }
  )
}

export async function estimateEVMUnwrapOperation (
  api: JEVMAPI,
  from: string,
  unwrap: UnwrapOperation
): Promise<ChainOperationSummary> {
  const chain: JEVMBlockchain = api.chain
  const data: string = unwrap.asset.adapter.getWithdrawData(unwrap.amount)
  const type: FeeType = FeeType.Unwrap
  const values = new Map<string, bigint>([[unwrap.asset.assetId, unwrap.amount]])
  return await estimateEVMCall(api, from, unwrap.asset.address, BigInt(0), data, type).then(
    (fee) => {
      const spending: BaseSpending = new BaseSpending(chain, unwrap.amount, unwrap.asset.assetId)
      return new ChainOperationSummary(unwrap, chain, fee, [spending, fee.spending], values)
    },
    async () => {
      const gasPrice: bigint = await estimateEVMGasPrice(api)
      const fee: BaseFeeData = new BaseFeeData(chain, DefaultUnwrapEstimate * gasPrice, type)
      const spending: BaseSpending = new BaseSpending(chain, unwrap.amount, unwrap.asset.assetId)
      return new ChainOperationSummary(unwrap, chain, fee, [spending, fee.spending], values)
    }
  )
}

export async function estimateEVMWithdrawJRC20 (
  api: JEVMAPI,
  sender: string,
  jrc20: JRC20Asset,
  amount: bigint
): Promise<EVMFeeData> {
  const type: FeeType = FeeType.Withdraw
  const data: string = jrc20.adapter.getWithdrawData(amount)
  return await estimateEVMCall(api, sender, jrc20.address, BigInt(0), data, type).then(
    (fee) => {
      return fee
    },
    async () => {
      const gasPrice: bigint = await estimateEVMGasPrice(api)
      const transactionData: EVMTransactionData = new EVMTransactionData(sender, jrc20.address, BigInt(0), data)
      return new EVMFeeData(
        api.chain,
        gasPrice * DefaultWithdrawEstimate,
        type,
        gasPrice,
        DefaultWithdrawEstimate,
        transactionData
      )
    }
  )
}

export async function estimateEVMDepositJRC20 (
  api: JEVMAPI,
  sender: string,
  jrc20: JRC20Asset,
  amount: bigint
): Promise<EVMFeeData> {
  const type: FeeType = FeeType.Deposit
  const data: string = jrc20.adapter.getDepositData(jrc20.nativeAssetId, amount)
  return await estimateEVMCall(api, sender, NativeAssetCallContract, BigInt(0), data, type).then(
    (fee) => {
      return fee
    },
    async () => {
      const gasPrice: bigint = await estimateEVMGasPrice(api)
      const transactionData: EVMTransactionData = new EVMTransactionData(
        sender,
        NativeAssetCallContract,
        BigInt(0),
        data
      )
      return new EVMFeeData(
        api.chain,
        gasPrice * DefaultDepositEstimate,
        type,
        gasPrice,
        DefaultDepositEstimate,
        transactionData
      )
    }
  )
}

export async function estimateEVMExportTransaction (
  api: JEVMAPI,
  assetId: string,
  destination: Blockchain
): Promise<BaseFeeData> {
  const gasLimit: bigint = estimateAtomicExportGas(api.chain.assetId, [assetId], destination.assetId)
  const gasPrice: bigint = await estimateEVMGasPrice(api)
  // the evm export fee is paid in gas so it must be multiplied by the atomic denominator
  const fee: bigint = calculateAtomicCost(gasLimit, gasPrice) * AtomicDenomination
  return new BaseFeeData(api.chain, fee, FeeType.ExportFee)
}

export async function sendEVMExportTransaction (
  provider: MCNProvider,
  api: JEVMAPI,
  wallet: MCNWallet,
  destination: Blockchain,
  assetId: string,
  amount: bigint,
  address: string,
  sendImportFee: boolean,
  importFee: bigint,
  fee?: FeeData
): Promise<string> {
  if (typeof fee === 'undefined') {
    fee = await estimateEVMExportTransaction(api, assetId, destination)
  }
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
        if ((error.message as string).includes('nonce')) {
          return undefined
        }
        // Non nonce related error decrement nonce to avoid resyncing later.
        evmWallet.nonce--
        throw error
      })
    if (typeof transactionId === 'string') {
      return transactionId
    }
    await sleep(1000)
    nonce = await getWalletNonce(evmWallet, api, true)
  }
  throw new TransactionError('could not provide a valid nonce')
}

export async function estimateEVMImportTransaction (
  api: JEVMAPI,
  inputsCount: number,
  outputsCount: number
): Promise<BaseFeeData> {
  const gasLimit: bigint = estimateAtomicImportGas(inputsCount, outputsCount)
  const gasPrice: bigint = await estimateEVMGasPrice(api)
  const fee: BaseFeeData = new BaseFeeData(api.chain, calculateAtomicCost(gasLimit, gasPrice), FeeType.ImportFee)
  // import fee is paid with utxos from shared memory so using JNT asset
  fee.asset = api.chain.asset.nativeAsset
  return fee
}

export async function sendEVMImportTransaction (
  provider: MCNProvider,
  api: JEVMAPI,
  wallet: MCNWallet,
  source: Blockchain,
  fee?: FeeData,
  utxoSet?: Utxo[]
): Promise<string> {
  const chainWallet: VMWallet = wallet.getWallet(api.chain)
  const sender: string = chainWallet.getJuneoAddress()
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [sender], source.id)
  }
  const values = getUtxosAmountValues(utxoSet, source.id)
  if (typeof fee === 'undefined') {
    fee = await estimateEVMImportTransaction(api, utxoSet.length, values.size)
  }
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
