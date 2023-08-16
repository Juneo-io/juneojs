import { type ethers, type TransactionRequest } from 'ethers'
import {
  FeeData, TransactionReceipt, type JEVMBlockchain, type JuneoWallet, type MCNProvider, type JEVMAPI, type JEVMWallet,
  TransactionType, EVMTransactionStatusFetcher, EVMTransactionStatus, FeeType, type WrappedAsset
} from '../juneo'

const StatusFetcherDelay: number = 100
const StatusFetcherMaxAttempts: number = 600

export class WrapManager {
  private readonly api: JEVMAPI
  private readonly wallet: JEVMWallet

  constructor (api: JEVMAPI, wallet: JEVMWallet) {
    this.api = api
    this.wallet = wallet
  }

  static from (provider: MCNProvider, wallet: JuneoWallet, chain: JEVMBlockchain): WrapManager {
    const api: JEVMAPI = provider.jevm[chain.id]
    return new WrapManager(api, wallet.getEthWallet(chain))
  }

  async estimateWrapFee (asset: WrappedAsset, amount: bigint): Promise<FeeData> {
    const chain: JEVMBlockchain = this.wallet.getChain() as JEVMBlockchain
    let txFee: bigint = await this.api.eth_baseFee()
    const hexAddress: string = this.wallet.getHexAddress()
    const data: string = asset.adapter.getDepositData()
    txFee *= await chain.ethProvider.estimateGas({
      from: hexAddress,
      to: asset.address,
      value: BigInt(amount),
      data
    })
    return new FeeData(chain, txFee, asset.address, FeeType.Wrap)
  }

  async estimateUnwrapFee (asset: WrappedAsset, amount: bigint): Promise<FeeData> {
    const chain: JEVMBlockchain = this.wallet.getChain() as JEVMBlockchain
    let txFee: bigint = await this.api.eth_baseFee()
    const hexAddress: string = this.wallet.getHexAddress()
    const data: string = asset.adapter.getWithdrawData(amount)
    txFee *= await chain.ethProvider.estimateGas({
      from: hexAddress,
      to: asset.address,
      value: BigInt(0),
      data
    })
    return new FeeData(chain, txFee, asset.address, FeeType.Unwrap)
  }

  async wrap (asset: WrappedAsset, amount: bigint): Promise<WrapHandler> {
    const wrapping: Wrapping = new Wrapping(asset, amount)
    const handler: WrappingHandler = new WrappingHandler()
    void handler.execute(this.api, this.wallet, wrapping)
    return handler
  }

  async unwrap (asset: WrappedAsset, amount: bigint): Promise<WrapHandler> {
    const wrapping: Wrapping = new Wrapping(asset, amount)
    const handler: UnwrappingHandler = new UnwrappingHandler()
    void handler.execute(this.api, this.wallet, wrapping)
    return handler
  }
}

class Wrapping {
  asset: WrappedAsset
  amount: bigint

  constructor (asset: WrappedAsset, amount: bigint) {
    this.asset = asset
    this.amount = amount
  }
}

export interface WrapHandler {
  getReceipt: () => TransactionReceipt | undefined
}

interface ExecutableWrapHandler extends WrapHandler {
  execute: (api: JEVMAPI, wallet: JEVMWallet, wrapping: Wrapping) => Promise<void>
}

class WrappingHandler implements ExecutableWrapHandler {
  private receipt: TransactionReceipt | undefined

  getReceipt (): TransactionReceipt | undefined {
    return this.receipt
  }

  async execute (api: JEVMAPI, wallet: JEVMWallet, wrapping: Wrapping): Promise<void> {
    const chain: JEVMBlockchain = wallet.getChain() as JEVMBlockchain
    this.receipt = new TransactionReceipt(chain.id, TransactionType.Wrap)
    const ethProvider: ethers.JsonRpcProvider = chain.ethProvider
    const evmWallet: ethers.Wallet = wallet.evmWallet.connect(ethProvider)
    let nonce: bigint = await api.eth_getTransactionCount(wallet.getHexAddress(), 'latest')
    const gasPrice: bigint = await api.eth_baseFee()
    const data: string = wrapping.asset.adapter.getDepositData()
    const gasLimit: bigint = await chain.ethProvider.estimateGas({
      from: wallet.getHexAddress(),
      to: wrapping.asset.address,
      value: BigInt(wrapping.amount),
      data
    })
    const transactionData: TransactionRequest = {
      from: wallet.getHexAddress(),
      to: wrapping.asset.address,
      value: wrapping.amount,
      nonce: Number(nonce++),
      chainId: chain.chainId,
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

  async execute (api: JEVMAPI, wallet: JEVMWallet, wrapping: Wrapping): Promise<void> {
    const chain: JEVMBlockchain = wallet.getChain() as JEVMBlockchain
    this.receipt = new TransactionReceipt(chain.id, TransactionType.Unwrap)
    const ethProvider: ethers.JsonRpcProvider = chain.ethProvider
    const evmWallet: ethers.Wallet = wallet.evmWallet.connect(ethProvider)
    let nonce: bigint = await api.eth_getTransactionCount(wallet.getHexAddress(), 'latest')
    const gasPrice: bigint = await api.eth_baseFee()
    const data: string = wrapping.asset.adapter.getWithdrawData(wrapping.amount)
    const gasLimit: bigint = await chain.ethProvider.estimateGas({
      from: wallet.getHexAddress(),
      to: wrapping.asset.address,
      value: BigInt(0),
      data
    })
    const transactionData: TransactionRequest = {
      from: wallet.getHexAddress(),
      to: wrapping.asset.address,
      value: BigInt(0),
      nonce: Number(nonce++),
      chainId: chain.chainId,
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
