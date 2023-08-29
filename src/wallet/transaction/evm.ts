import { type ethers } from 'ethers'
import { BaseFeeData, FeeType } from './fee'
import { type JEVMAPI } from '../../api'
import { JEVMBlockchain } from '../../chain'
import { MCNOperationSummary } from '../operation'
import { type UnwrapOperation, type WrapOperation } from '../wrap'
import { BaseSpending } from './transaction'

const DefaultWrapEstimate: bigint = BigInt('55000000000000')
const DefaultUnwrapEstimate: bigint = BigInt('45000000000000')

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
  let nonce: bigint = await api.eth_getTransactionCount(wallet.address, 'pending')
  const transaction: string = await wallet.signTransaction({
    from: wallet.address,
    to: feeData.data.to,
    value: feeData.data.value,
    nonce: Number(nonce++),
    chainId: api.chain.chainId,
    gasLimit: feeData.gasLimit,
    gasPrice: feeData.gasPrice,
    data: feeData.data.data
  })
  return await api.eth_sendRawTransaction(transaction)
}

export async function estimateEVMWrapOperation (api: JEVMAPI, from: string, wrap: WrapOperation): Promise<MCNOperationSummary> {
  const chain: JEVMBlockchain = api.chain
  const data: string = wrap.asset.adapter.getDepositData()
  const type: FeeType = FeeType.Wrap
  return await estimateEVMTransaction(api, wrap.asset.assetId, from, wrap.asset.address, wrap.amount, data, type).then(fee => {
    return new MCNOperationSummary(wrap, chain, [fee], [new BaseSpending(chain.id, wrap.amount, chain.assetId), fee])
  }, async () => {
    const gasPrice: bigint = await api.eth_baseFee().catch(() => {
      return chain.baseFee
    })
    const fee: BaseFeeData = new BaseFeeData(chain, DefaultWrapEstimate * gasPrice, type)
    return new MCNOperationSummary(wrap, chain, [fee], [new BaseSpending(chain.id, wrap.amount, chain.assetId), fee])
  })
}

export async function estimateEVMUnwrapOperation (api: JEVMAPI, from: string, unwrap: UnwrapOperation): Promise<MCNOperationSummary> {
  const chain: JEVMBlockchain = api.chain
  const data: string = unwrap.asset.adapter.getWithdrawData(unwrap.amount)
  const type: FeeType = FeeType.Unwrap
  return await estimateEVMTransaction(api, unwrap.asset.assetId, from, unwrap.asset.address, BigInt(0), data, type).then(fee => {
    return new MCNOperationSummary(unwrap, chain, [fee], [new BaseSpending(chain.id, unwrap.amount, unwrap.asset.assetId), fee])
  }, async () => {
    const gasPrice: bigint = await api.eth_baseFee().catch(() => {
      return chain.baseFee
    })
    const fee: BaseFeeData = new BaseFeeData(chain, DefaultUnwrapEstimate * gasPrice, type)
    return new MCNOperationSummary(unwrap, chain, [fee], [new BaseSpending(chain.id, unwrap.amount, unwrap.asset.assetId), fee])
  })
}
