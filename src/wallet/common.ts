import { type ethers } from 'ethers'
import { EVMFeeData } from './fee'
import { type JEVMAPI } from '../api'
import { type FeeType } from '../transaction'

export const WalletStatusFetcherDelay: number = 100
export const WalletStatusFetcherMaxAttempts: number = 600

export enum TransactionType {
  Base = 'Base transaction',
  Send = 'Send transaction',
  Export = 'Export transaction',
  Import = 'Import transaction',
  Withdraw = 'Withdraw transaction',
  Deposit = 'Deposit transaction',
  Wrap = 'Wrap transaction',
  Unwrap = 'Unwrap transaction',
  Validate = 'Validate transaction',
  Delegate = 'Delegate transaction'
}

export class TransactionReceipt {
  chainId: string
  transactionType: string
  transactionId: string | undefined
  transactionStatus: string | undefined

  constructor (chainId: string, transactionType: string) {
    this.chainId = chainId
    this.transactionType = transactionType
  }
}

export class EVMTransactionData {
  address: string
  amount: bigint
  fee: EVMFeeData
  data: string

  constructor (address: string, amount: bigint, fee: EVMFeeData, data: string) {
    this.address = address
    this.amount = amount
    this.fee = fee
    this.data = data
  }
}

export async function estimateEVMTransaction (api: JEVMAPI, sender: string, address: string, amount: bigint, data: string, type: FeeType): Promise<EVMFeeData> {
  const gasPrice: bigint = await api.eth_baseFee().catch(error => {
    throw error
  })
  const gasLimit: bigint = await api.chain.ethProvider.estimateGas({
    from: sender,
    to: address,
    value: BigInt(amount),
    chainId: api.chain.chainId,
    gasPrice,
    data
  }).catch(error => {
    throw error
  })
  return new EVMFeeData(api.chain, gasPrice * gasLimit, address, type, gasPrice, gasLimit)
}

export async function sendEVMTransaction (api: JEVMAPI, wallet: ethers.Wallet, transactionData: EVMTransactionData): Promise<string> {
  let nonce: bigint = await api.eth_getTransactionCount(wallet.address, 'latest').catch(error => {
    throw error
  })
  const transaction: string = await wallet.signTransaction({
    from: wallet.address,
    to: transactionData.address,
    value: transactionData.amount,
    nonce: Number(nonce++),
    chainId: api.chain.chainId,
    gasLimit: transactionData.fee.gasLimit,
    gasPrice: transactionData.fee.gasPrice,
    data: transactionData.data
  })
  return await api.eth_sendRawTransaction(transaction).catch(error => {
    throw error
  })
}
