import { type ethers } from 'ethers'
import { FeeData, TransactionReceipt, type JEVMBlockchain, type JuneoWallet, type MCNProvider, type JEVMAPI, type JEVMWallet, TransactionType, EVMTransactionStatusFetcher, EVMTransactionStatus } from '../juneo'
import { type WETHContractAdapter } from '../solidity'
import { type TransactionRequest } from 'ethers/types/providers'

const StatusFetcherDelay: number = 100
const StatusFetcherMaxAttempts: number = 600

export enum WrapFeeType {
  Wrap = 'Wrap fee',
  Unwrap = 'Unwrap fee'
}

export class WrapManager {
  private readonly provider: MCNProvider
  private readonly wallet: JuneoWallet

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  async estimateWrapFee (chain: JEVMBlockchain, adapter: WETHContractAdapter, amount: bigint): Promise<FeeData> {
    let txFee: bigint = await chain.queryBaseFee(this.provider)
    const hexAddress: string = this.wallet.getEthAddress(chain)
    const data: string = adapter.getDepositData()
    txFee *= await chain.ethProvider.estimateGas({
      from: hexAddress,
      to: adapter.contractAddress,
      value: BigInt(amount),
      data
    })
    return new FeeData(chain, txFee, adapter.contractAddress, WrapFeeType.Wrap)
  }

  async estimateUnwrapFee (chain: JEVMBlockchain, adapter: WETHContractAdapter, amount: bigint): Promise<FeeData> {
    let txFee: bigint = await chain.queryBaseFee(this.provider)
    const hexAddress: string = this.wallet.getEthAddress(chain)
    const data: string = adapter.getWithdrawData(amount)
    txFee *= await chain.ethProvider.estimateGas({
      from: hexAddress,
      to: adapter.contractAddress,
      value: BigInt(0),
      data
    })
    return new FeeData(chain, txFee, adapter.contractAddress, WrapFeeType.Unwrap)
  }

  async wrap (chain: JEVMBlockchain, adapter: WETHContractAdapter, amount: bigint): Promise<WrapHandler> {
    const wrapping: Wrapping = new Wrapping(chain, adapter, amount)
    const handler: WrappingHandler = new WrappingHandler()
    void handler.execute(this.provider, this.wallet, wrapping)
    return handler
  }

  async unwrap (chain: JEVMBlockchain, adapter: WETHContractAdapter, amount: bigint): Promise<WrapHandler> {
    const wrapping: Wrapping = new Wrapping(chain, adapter, amount)
    const handler: UnwrappingHandler = new UnwrappingHandler()
    void handler.execute(this.provider, this.wallet, wrapping)
    return handler
  }
}

class Wrapping {
  chain: JEVMBlockchain
  adapter: WETHContractAdapter
  amount: bigint

  constructor (chain: JEVMBlockchain, adapter: WETHContractAdapter, amount: bigint) {
    this.chain = chain
    this.adapter = adapter
    this.amount = amount
  }
}

export interface WrapHandler {
  getReceipt: () => TransactionReceipt | undefined
}

interface ExecutableWrapHandler extends WrapHandler {
  execute: (provider: MCNProvider, wallet: JuneoWallet, wrapping: Wrapping) => Promise<void>
}

class WrappingHandler implements ExecutableWrapHandler {
  private receipt: TransactionReceipt | undefined

  getReceipt (): TransactionReceipt | undefined {
    return this.receipt
  }

  async execute (provider: MCNProvider, wallet: JuneoWallet, wrapping: Wrapping): Promise<void> {
    this.receipt = new TransactionReceipt(wrapping.chain.id, TransactionType.Wrap)
    const jevmWallet: JEVMWallet = wallet.getEthWallet(wrapping.chain)
    const ethProvider: ethers.JsonRpcProvider = wrapping.chain.ethProvider
    const evmWallet: ethers.Wallet = jevmWallet.evmWallet.connect(ethProvider)
    const api: JEVMAPI = provider.jevm[wrapping.chain.id]
    let nonce: bigint = await api.eth_getTransactionCount(jevmWallet.getHexAddress(), 'latest')
    const gasPrice: bigint = await api.eth_baseFee()
    const data: string = wrapping.adapter.getDepositData()
    const gasLimit: bigint = await wrapping.chain.ethProvider.estimateGas({
      from: wallet.getEthAddress(wrapping.chain),
      to: wrapping.adapter.contractAddress,
      value: BigInt(wrapping.amount),
      data
    })
    const transactionData: TransactionRequest = {
      from: evmWallet.address,
      to: wrapping.adapter.contractAddress,
      value: wrapping.amount,
      nonce: Number(nonce++),
      chainId: wrapping.chain.chainId,
      gasLimit,
      gasPrice,
      data
    }
    const transaction: string = await evmWallet.signTransaction(transactionData)
    const transactionHash: string = await api.eth_sendRawTransaction(transaction)
    this.receipt.transactionId = transactionHash
    this.receipt.transactionStatus = EVMTransactionStatus.Unknown
    const transactionStatus: string = await new EVMTransactionStatusFetcher(api,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionHash).fetch()
    this.receipt.transactionStatus = transactionStatus
  }
}

class UnwrappingHandler implements ExecutableWrapHandler {
  private receipt: TransactionReceipt | undefined

  getReceipt (): TransactionReceipt | undefined {
    return this.receipt
  }

  async execute (provider: MCNProvider, wallet: JuneoWallet, wrapping: Wrapping): Promise<void> {
    this.receipt = new TransactionReceipt(wrapping.chain.id, TransactionType.Unwrap)
    const jevmWallet: JEVMWallet = wallet.getEthWallet(wrapping.chain)
    const ethProvider: ethers.JsonRpcProvider = wrapping.chain.ethProvider
    const evmWallet: ethers.Wallet = jevmWallet.evmWallet.connect(ethProvider)
    const api: JEVMAPI = provider.jevm[wrapping.chain.id]
    let nonce: bigint = await api.eth_getTransactionCount(jevmWallet.getHexAddress(), 'latest')
    const gasPrice: bigint = await api.eth_baseFee()
    const data: string = wrapping.adapter.getWithdrawData(wrapping.amount)
    const gasLimit: bigint = await wrapping.chain.ethProvider.estimateGas({
      from: wallet.getEthAddress(wrapping.chain),
      to: wrapping.adapter.contractAddress,
      value: BigInt(0),
      data
    })
    const transactionData: TransactionRequest = {
      from: evmWallet.address,
      to: wrapping.adapter.contractAddress,
      value: BigInt(0),
      nonce: Number(nonce++),
      chainId: wrapping.chain.chainId,
      gasLimit,
      gasPrice,
      data
    }
    const transaction: string = await evmWallet.signTransaction(transactionData)
    const transactionHash: string = await api.eth_sendRawTransaction(transaction)
    this.receipt.transactionId = transactionHash
    this.receipt.transactionStatus = EVMTransactionStatus.Unknown
    const transactionStatus: string = await new EVMTransactionStatusFetcher(api,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionHash).fetch()
    this.receipt.transactionStatus = transactionStatus
  }
}
