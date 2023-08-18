import { type ethers, type TransactionRequest } from 'ethers'
import { type JEVMAPI } from '../api'
import { type JEVMWallet, type JuneoWallet } from './wallet'
import { type JEVMBlockchain, type WrappedAsset } from '../chain'
import { EVMTransactionStatus, EVMTransactionStatusFetcher, FeeType } from '../transaction'
import { type MCNOperation, MCNOperationType, WalletStatusFetcherDelay, WalletStatusFetcherMaxAttempts, type ExecutableMCNOperation, MCNOperationStatus } from './common'
import { TransactionReceipt, TransactionType } from './transfer'
import { EVMFeeData } from './fee'
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

  async estimateWrapFee (wrap: WrapOperation): Promise<EVMFeeData> {
    const chain: JEVMBlockchain = this.api.chain
    const gasPrice: bigint = await this.api.eth_baseFee().catch(error => {
      throw error
    })
    const hexAddress: string = this.wallet.getHexAddress()
    const data: string = wrap.asset.adapter.getDepositData()
    const gasLimit: bigint = await chain.ethProvider.estimateGas({
      from: hexAddress,
      to: wrap.asset.address,
      value: BigInt(wrap.amount),
      data
    }).catch(error => {
      throw error
    })
    return new EVMFeeData(chain, gasPrice * gasLimit, wrap.asset.address, FeeType.Wrap, gasPrice, gasLimit)
  }

  async estimateUnwrapFee (unwrap: UnwrapOperation): Promise<EVMFeeData> {
    const chain: JEVMBlockchain = this.api.chain
    const gasPrice: bigint = await this.api.eth_baseFee().catch(error => {
      throw error
    })
    const hexAddress: string = this.wallet.getHexAddress()
    const data: string = unwrap.asset.adapter.getWithdrawData(unwrap.amount)
    const gasLimit: bigint = await chain.ethProvider.estimateGas({
      from: hexAddress,
      to: unwrap.asset.address,
      value: BigInt(0),
      data
    }).catch(error => {
      throw error
    })
    return new EVMFeeData(chain, gasPrice * gasLimit, unwrap.asset.address, FeeType.Unwrap, gasPrice, gasLimit)
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
    const feeData: EVMFeeData = executable.summary.fees[0] as EVMFeeData
    const wrapping: WrapOperation = executable.summary.operation as WrapOperation
    const data: string = wrapping.asset.adapter.getDepositData()
    const transactionData: TransactionRequest = {
      from: this.wallet.getHexAddress(),
      to: wrapping.asset.address,
      value: wrapping.amount,
      nonce: Number(nonce++),
      chainId: chain.chainId,
      gasLimit: feeData.gasLimit,
      gasPrice: feeData.gasPrice,
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
    const wrapping: WrapOperation = executable.summary.operation as UnwrapOperation
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

  async wrap (asset: WrappedAsset, amount: bigint): Promise<TransactionReceipt> {
    const chain: JEVMBlockchain = this.api.chain
    const receipt: TransactionReceipt = new TransactionReceipt(chain.id, TransactionType.Wrap)
    const evmWallet: ethers.Wallet = this.wallet.evmWallet.connect(chain.ethProvider)
    let nonce: bigint = await this.api.eth_getTransactionCount(this.wallet.getHexAddress(), 'latest')
    const gasPrice: bigint = await this.api.eth_baseFee()
    const data: string = asset.adapter.getDepositData()
    const gasLimit: bigint = await chain.ethProvider.estimateGas({
      from: this.wallet.getHexAddress(),
      to: asset.address,
      value: BigInt(amount),
      data
    })
    const transactionData: TransactionRequest = {
      from: this.wallet.getHexAddress(),
      to: asset.address,
      value: amount,
      nonce: Number(nonce++),
      chainId: chain.chainId,
      gasLimit,
      gasPrice,
      data
    }
    const transaction: string = await evmWallet.signTransaction(transactionData)
    const transactionHash: string = await this.api.eth_sendRawTransaction(transaction)
    receipt.transactionId = transactionHash
    receipt.transactionStatus = EVMTransactionStatus.Unknown
    const transactionStatus: string = await new EVMTransactionStatusFetcher(this.api,
      WalletStatusFetcherDelay, WalletStatusFetcherMaxAttempts, transactionHash).fetch()
    receipt.transactionStatus = transactionStatus
    return receipt
  }

  async unwrap (asset: WrappedAsset, amount: bigint): Promise<TransactionReceipt> {
    const chain: JEVMBlockchain = this.api.chain
    const receipt: TransactionReceipt = new TransactionReceipt(chain.id, TransactionType.Unwrap)
    const evmWallet: ethers.Wallet = this.wallet.evmWallet.connect(chain.ethProvider)
    let nonce: bigint = await this.api.eth_getTransactionCount(this.wallet.getHexAddress(), 'latest')
    const gasPrice: bigint = await this.api.eth_baseFee()
    const data: string = asset.adapter.getWithdrawData(amount)
    const gasLimit: bigint = await chain.ethProvider.estimateGas({
      from: this.wallet.getHexAddress(),
      to: asset.address,
      value: BigInt(0),
      data
    })
    const transactionData: TransactionRequest = {
      from: this.wallet.getHexAddress(),
      to: asset.address,
      value: BigInt(0),
      nonce: Number(nonce++),
      chainId: chain.chainId,
      gasLimit,
      gasPrice,
      data
    }
    const transaction: string = await evmWallet.signTransaction(transactionData)
    const transactionHash: string = await this.api.eth_sendRawTransaction(transaction)
    receipt.transactionId = transactionHash
    receipt.transactionStatus = EVMTransactionStatus.Unknown
    const transactionStatus: string = await new EVMTransactionStatusFetcher(this.api,
      WalletStatusFetcherDelay, WalletStatusFetcherMaxAttempts, transactionHash).fetch()
    receipt.transactionStatus = transactionStatus
    return receipt
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
