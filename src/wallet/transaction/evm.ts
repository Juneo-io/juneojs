import { type ethers } from 'ethers'
import { BaseFeeData, type FeeData, FeeType } from './fee'
import { type JEVMAPI } from '../../api'
import { type Blockchain, JEVMBlockchain, type JRC20Asset, NativeAssetCallContract } from '../../chain'
import { ChainOperationSummary } from '../operation'
import { type UnwrapOperation, type WrapOperation } from '../wrap'
import { BaseSpending } from './transaction'
import {
  type JEVMExportTransaction, type JEVMImportTransaction, UserInput, type Utxo,
  buildJEVMExportTransaction, buildJEVMImportTransaction, fetchUtxos
} from '../../transaction'
import { type VMWallet, type MCNWallet } from '../wallet'
import { type MCNProvider } from '../../juneo'

const DefaultWrapEstimate: bigint = BigInt(55_000)
const DefaultUnwrapEstimate: bigint = BigInt(45_000)
// values below should be tested and reduced for more precision
const DefaultWithdrawEstimate: bigint = BigInt(100_000)
const DefaultDepositEstimate: bigint = BigInt(100_000)

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

  constructor (chain: JEVMBlockchain, amount: bigint, type: string, gasPrice: bigint, gasLimit: bigint, data: EVMTransactionData) {
    super(chain, amount, type)
    this.gasPrice = gasPrice
    this.gasLimit = gasLimit
    this.data = data
  }
}

export async function estimateEVMTransaction (api: JEVMAPI, assetId: string, from: string, to: string, value: bigint, data: string, type: FeeType): Promise<EVMFeeData> {
  const gasPrice: bigint = await api.eth_baseFee()
  const gasLimit: bigint = assetId === api.chain.assetId
    ? JEVMBlockchain.SendEtherGasLimit
    : await api.chain.ethProvider.estimateGas({
      from,
      to,
      value,
      chainId: api.chain.chainId,
      gasPrice,
      data
    })
  const transactionData: EVMTransactionData = new EVMTransactionData(from, to, value, data)
  return new EVMFeeData(api.chain, gasPrice * gasLimit, type, gasPrice, gasLimit, transactionData)
}

export async function sendEVMTransaction (api: JEVMAPI, wallet: ethers.Wallet, feeData: EVMFeeData): Promise<string> {
  const nonce: bigint = await api.eth_getTransactionCount(wallet.address, 'pending')
  const transaction: string = await wallet.signTransaction({
    from: wallet.address,
    to: feeData.data.to,
    value: feeData.data.value,
    nonce: Number(nonce),
    chainId: api.chain.chainId,
    gasLimit: feeData.gasLimit,
    gasPrice: feeData.gasPrice,
    data: feeData.data.data
  })
  return await api.eth_sendRawTransaction(transaction)
}

export async function estimateEVMWrapOperation (api: JEVMAPI, from: string, wrap: WrapOperation): Promise<ChainOperationSummary> {
  const chain: JEVMBlockchain = api.chain
  const data: string = wrap.asset.adapter.getDepositData()
  const type: FeeType = FeeType.Wrap
  return await estimateEVMTransaction(api, wrap.asset.assetId, from, wrap.asset.address, wrap.amount, data, type).then(fee => {
    return new ChainOperationSummary(wrap, chain, fee, [new BaseSpending(chain, wrap.amount, chain.assetId), fee.getAsSpending()])
  }, async () => {
    const gasPrice: bigint = await api.eth_baseFee().catch(() => {
      return chain.baseFee
    })
    const fee: BaseFeeData = new BaseFeeData(chain, DefaultWrapEstimate * gasPrice, type)
    return new ChainOperationSummary(wrap, chain, fee, [new BaseSpending(chain, wrap.amount, chain.assetId), fee.getAsSpending()])
  })
}

export async function estimateEVMUnwrapOperation (api: JEVMAPI, from: string, unwrap: UnwrapOperation): Promise<ChainOperationSummary> {
  const chain: JEVMBlockchain = api.chain
  const data: string = unwrap.asset.adapter.getWithdrawData(unwrap.amount)
  const type: FeeType = FeeType.Unwrap
  return await estimateEVMTransaction(api, unwrap.asset.assetId, from, unwrap.asset.address, BigInt(0), data, type).then(fee => {
    return new ChainOperationSummary(unwrap, chain, fee, [new BaseSpending(chain, unwrap.amount, unwrap.asset.assetId), fee.getAsSpending()])
  }, async () => {
    const gasPrice: bigint = await api.eth_baseFee().catch(() => {
      return chain.baseFee
    })
    const fee: BaseFeeData = new BaseFeeData(chain, DefaultUnwrapEstimate * gasPrice, type)
    return new ChainOperationSummary(unwrap, chain, fee, [new BaseSpending(chain, unwrap.amount, unwrap.asset.assetId), fee.getAsSpending()])
  })
}

export async function estimateEVMWithdrawJRC20 (api: JEVMAPI, sender: string, jrc20: JRC20Asset, amount: bigint): Promise<EVMFeeData> {
  const type: FeeType = FeeType.Withdraw
  const data: string = jrc20.adapter.getWithdrawData(amount)
  return await estimateEVMTransaction(api, jrc20.address, sender, jrc20.address, BigInt(0), data, type).then(fee => {
    return fee
  }, async () => {
    const gasPrice: bigint = await api.eth_baseFee().catch(() => {
      return api.chain.baseFee
    })
    const transactionData: EVMTransactionData = new EVMTransactionData(sender, jrc20.address, BigInt(0), data)
    return new EVMFeeData(api.chain, gasPrice * DefaultWithdrawEstimate, type, gasPrice, DefaultWithdrawEstimate, transactionData)
  })
}

export async function estimateEVMDepositJRC20 (api: JEVMAPI, sender: string, jrc20: JRC20Asset, amount: bigint): Promise<EVMFeeData> {
  const type: FeeType = FeeType.Deposit
  const data: string = jrc20.adapter.getDepositData(jrc20.nativeAssetId, amount)
  return await estimateEVMTransaction(api, jrc20.address, sender, NativeAssetCallContract, BigInt(0), data, type).then(fee => {
    return fee
  }, async () => {
    const gasPrice: bigint = await api.eth_baseFee().catch(() => {
      return api.chain.baseFee
    })
    const transactionData: EVMTransactionData = new EVMTransactionData(sender, NativeAssetCallContract, BigInt(0), data)
    return new EVMFeeData(api.chain, gasPrice * DefaultDepositEstimate, type, gasPrice, DefaultDepositEstimate, transactionData)
  })
}

export async function estimateEVMExportTransaction (api: JEVMAPI, assetId: string, destination: Blockchain): Promise<BaseFeeData> {
  const gasLimit: bigint = api.chain.estimateAtomicExportGas([assetId], destination.assetId)
  const gasPrice: bigint = await api.eth_baseFee()
  // the evm export fee is paid in gas so it must be multiplied by the atomic denominator
  const fee: bigint = api.chain.calculateAtomicCost(gasLimit, gasPrice) * JEVMBlockchain.AtomicDenomination
  return new BaseFeeData(api.chain, fee, FeeType.ExportFee)
}

export async function sendEVMExportTransaction (
  provider: MCNProvider, api: JEVMAPI, wallet: MCNWallet, destination: Blockchain, assetId: string, amount: bigint, address: string,
  sendImportFee: boolean, importFee: bigint, fee?: FeeData
): Promise<string> {
  if (typeof fee === 'undefined') {
    fee = await estimateEVMExportTransaction(api, assetId, destination)
  }
  // exportations of the gas token must be divided by atomic denomination
  if (assetId === api.chain.assetId) {
    amount /= JEVMBlockchain.AtomicDenomination
  }
  // fee is also gas token
  const feeAmount: bigint = fee.amount / JEVMBlockchain.AtomicDenomination
  const exportAddress: string = wallet.getWallet(destination).getJuneoAddress()
  const nonce: bigint = await api.eth_getTransactionCount(wallet.getAddress(api.chain), 'pending')
  const transaction: JEVMExportTransaction = buildJEVMExportTransaction([new UserInput(assetId, api.chain, amount, address, destination)],
    wallet.getAddress(api.chain), nonce, exportAddress, feeAmount, sendImportFee ? importFee : BigInt(0), provider.mcn.id
  )
  return (await api.issueTx(transaction.signTransaction([wallet.getWallet(api.chain)]).toCHex())).txID
}

export async function estimateEVMImportTransaction (api: JEVMAPI, hasExtraFee: boolean): Promise<BaseFeeData> {
  const inputsCount: number = hasExtraFee ? 2 : 1
  const outputsCount: number = hasExtraFee ? 2 : 1
  const gasLimit: bigint = api.chain.estimateAtomicImportGas(inputsCount, outputsCount)
  const gasPrice: bigint = await api.eth_baseFee()
  const fee: BaseFeeData = new BaseFeeData(api.chain, api.chain.calculateAtomicCost(gasLimit, gasPrice), FeeType.ImportFee)
  // import fee is paid with utxos from shared memory so using JNT asset
  fee.asset = api.chain.asset.nativeAsset
  return fee
}

export async function sendEVMImportTransaction (
  provider: MCNProvider, api: JEVMAPI, wallet: MCNWallet, source: Blockchain, assetId: string,
  amount: bigint, address: string, fee?: FeeData, utxoSet?: Utxo[], extraGasFeeAmount: bigint = BigInt(0)
): Promise<string> {
  const chainWallet: VMWallet = wallet.getWallet(api.chain)
  const sender: string = chainWallet.getJuneoAddress()
  const hasExtraFee: boolean = extraGasFeeAmount > BigInt(0)
  if (typeof fee === 'undefined') {
    fee = await estimateEVMImportTransaction(api, hasExtraFee)
  }
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [sender], source.id)
  }
  const inputs: UserInput[] = [new UserInput(assetId, source, amount, address, api.chain)]
  if (hasExtraFee) {
    inputs.push(new UserInput(api.chain.assetId, source, extraGasFeeAmount, address, api.chain))
  }
  const transaction: JEVMImportTransaction = buildJEVMImportTransaction(inputs, utxoSet, [sender], fee.amount, provider.mcn.id)
  return (await api.issueTx(transaction.signTransaction([chainWallet]).toCHex())).txID
}
