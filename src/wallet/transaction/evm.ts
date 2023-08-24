import { type ethers } from 'ethers'
import { FeeData, type FeeType } from './fee'
import { type JEVMAPI } from '../../api'
import { JEVMBlockchain } from '../../chain'

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

export class EVMFeeData extends FeeData {
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
