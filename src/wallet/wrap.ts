import { type ethers, type TransactionRequest } from 'ethers'
import { type JEVMAPI } from '../api'
import { type JEVMWallet, type JuneoWallet } from './wallet'
import { type JEVMBlockchain, type WrappedAsset } from '../chain'
import { EVMTransactionStatus, EVMTransactionStatusFetcher, FeeData, FeeType } from '../transaction'
import { type MCNOperation, MCNOperationType, WalletStatusFetcherDelay, WalletStatusFetcherMaxAttempts, type ExecutableMCNOperation, MCNOperationStatus } from './common'
import { TransactionReceipt, TransactionType } from './transfer'
import { type MCNProvider } from '../juneo'

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

  async estimateWrapFee (wrap: WrapOperation): Promise<FeeData> {
    const chain: JEVMBlockchain = this.api.chain
    let txFee: bigint = await this.api.eth_baseFee().catch(error => {
      throw error
    })
    const hexAddress: string = this.wallet.getHexAddress()
    const data: string = wrap.asset.adapter.getDepositData()
    txFee *= await chain.ethProvider.estimateGas({
      from: hexAddress,
      to: wrap.asset.address,
      value: BigInt(wrap.amount),
      data
    }).catch(error => {
      throw error
    })
    return new FeeData(chain, txFee, wrap.asset.address, FeeType.Wrap)
  }

  async estimateUnwrapFee (unwrap: UnwrapOperation): Promise<FeeData> {
    const chain: JEVMBlockchain = this.api.chain
    let txFee: bigint = await this.api.eth_baseFee().catch(error => {
      throw error
    })
    const hexAddress: string = this.wallet.getHexAddress()
    const data: string = unwrap.asset.adapter.getWithdrawData(unwrap.amount)
    txFee *= await chain.ethProvider.estimateGas({
      from: hexAddress,
      to: unwrap.asset.address,
      value: BigInt(0),
      data
    }).catch(error => {
      throw error
    })
    return new FeeData(chain, txFee, unwrap.asset.address, FeeType.Unwrap)
  }

  async executeWrap (executable: ExecutableMCNOperation): Promise<void> {
    executable.status = MCNOperationStatus.Executing
    const chain: JEVMBlockchain = this.api.chain
    const receipt: TransactionReceipt = new TransactionReceipt(chain.id, TransactionType.Wrap)
    executable.receipts.push(receipt)
    const evmWallet: ethers.Wallet = this.wallet.evmWallet.connect(chain.ethProvider)
    let nonce: bigint = await this.api.eth_getTransactionCount(this.wallet.getHexAddress(), 'latest').catch(error => {
      throw error
    })
    const gasPrice: bigint = await this.api.eth_baseFee().catch(error => {
      throw error
    })
    const wrapping: WrapOperation = executable.operation as WrapOperation
    const data: string = wrapping.asset.adapter.getDepositData()
    const gasLimit: bigint = await chain.ethProvider.estimateGas({
      from: this.wallet.getHexAddress(),
      to: wrapping.asset.address,
      value: BigInt(0),
      data
    }).catch(error => {
      throw error
    })
    const transactionData: TransactionRequest = {
      from: this.wallet.getHexAddress(),
      to: wrapping.asset.address,
      value: wrapping.amount,
      nonce: Number(nonce++),
      chainId: chain.chainId,
      gasLimit,
      gasPrice,
      data
    }
    const transaction: string = await evmWallet.signTransaction(transactionData)
    const transactionHash: string = await this.api.eth_sendRawTransaction(transaction).catch(error => {
      throw error
    })
    receipt.transactionId = transactionHash
    receipt.transactionStatus = EVMTransactionStatus.Unknown
    const transactionStatus: string = await new EVMTransactionStatusFetcher(this.api,
      WalletStatusFetcherDelay, WalletStatusFetcherMaxAttempts, transactionHash).fetch()
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === EVMTransactionStatus.Success) {
      executable.status = MCNOperationStatus.Done
    } else if (transactionStatus === EVMTransactionStatus.Failure) {
      executable.status = MCNOperationStatus.Error
    } else {
      executable.status = MCNOperationStatus.Timeout
    }
  }

  async executeUnwrap (executable: ExecutableMCNOperation): Promise<void> {
    executable.status = MCNOperationStatus.Executing
    const chain: JEVMBlockchain = this.api.chain
    const receipt: TransactionReceipt = new TransactionReceipt(chain.id, TransactionType.Unwrap)
    executable.receipts.push(receipt)
    const evmWallet: ethers.Wallet = this.wallet.evmWallet.connect(chain.ethProvider)
    let nonce: bigint = await this.api.eth_getTransactionCount(this.wallet.getHexAddress(), 'latest').catch(error => {
      throw error
    })
    const gasPrice: bigint = await this.api.eth_baseFee().catch(error => {
      throw error
    })
    const wrapping: WrapOperation = executable.operation as UnwrapOperation
    const data: string = wrapping.asset.adapter.getWithdrawData(wrapping.amount)
    const gasLimit: bigint = await chain.ethProvider.estimateGas({
      from: this.wallet.getHexAddress(),
      to: wrapping.asset.address,
      value: BigInt(0),
      data
    }).catch(error => {
      throw error
    })
    const transactionData: TransactionRequest = {
      from: this.wallet.getHexAddress(),
      to: wrapping.asset.address,
      value: BigInt(0),
      nonce: Number(nonce++),
      chainId: chain.chainId,
      gasLimit,
      gasPrice,
      data
    }
    const transaction: string = await evmWallet.signTransaction(transactionData)
    const transactionHash: string = await this.api.eth_sendRawTransaction(transaction).catch(error => {
      throw error
    })
    receipt.transactionId = transactionHash
    receipt.transactionStatus = EVMTransactionStatus.Unknown
    const transactionStatus: string = await new EVMTransactionStatusFetcher(this.api,
      WalletStatusFetcherDelay, WalletStatusFetcherMaxAttempts, transactionHash).fetch()
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === EVMTransactionStatus.Success) {
      executable.status = MCNOperationStatus.Done
    } else if (transactionStatus === EVMTransactionStatus.Failure) {
      executable.status = MCNOperationStatus.Error
    } else {
      executable.status = MCNOperationStatus.Timeout
    }
  }

  async wrap (wrap: WrapOperation): Promise<WrapHandler> {
    const handler: WrappingHandler = new WrappingHandler()
    void handler.execute(this.api, this.wallet, wrap)
    return handler
  }

  async unwrap (unwrap: UnwrapOperation): Promise<WrapHandler> {
    const handler: UnwrappingHandler = new UnwrappingHandler()
    void handler.execute(this.api, this.wallet, unwrap)
    return handler
  }
}

abstract class Wrapping {
  asset: WrappedAsset
  amount: bigint

  constructor (asset: WrappedAsset, amount: bigint) {
    this.asset = asset
    this.amount = amount
  }
}

export class WrapOperation extends Wrapping implements MCNOperation {
  type: MCNOperationType = MCNOperationType.Wrap
}

export class UnwrapOperation extends Wrapping implements MCNOperation {
  type: MCNOperationType = MCNOperationType.Unwrap
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
      WalletStatusFetcherDelay, WalletStatusFetcherMaxAttempts, transactionHash).fetch()
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
      WalletStatusFetcherDelay, WalletStatusFetcherMaxAttempts, transactionHash).fetch()
    this.receipt.transactionStatus = transactionStatus
  }
}
