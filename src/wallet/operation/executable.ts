import { type MCNProvider } from '../../juneo'
import {
  EVMTransactionStatus,
  EVMTransactionStatusFetcher,
  JEVMTransactionStatus,
  JEVMTransactionStatusFetcher,
  JVMTransactionStatus,
  JVMTransactionStatusFetcher,
  PlatformTransactionStatus,
  PlatformTransactionStatusFetcher
} from '../../transaction'
import {
  TransactionReceipt,
  type TransactionType,
  WalletStatusFetcherDelay,
  WalletStatusFetcherTimeout
} from '../transaction'
import { NetworkOperationStatus } from './operation'

export class ExecutableOperation {
  provider: MCNProvider
  status: NetworkOperationStatus = NetworkOperationStatus.Initializing
  receipts: TransactionReceipt[] = []

  constructor (provider: MCNProvider) {
    this.provider = provider
  }

  async trackEVMTransaction (chainId: string, transactionHash: string, type: TransactionType): Promise<boolean> {
    const api = this.provider.jevmApi[chainId]
    const receipt = new TransactionReceipt(api.chain.id, type, EVMTransactionStatus.Pending, transactionHash)
    this.receipts.push(receipt)
    const transactionStatus = await new EVMTransactionStatusFetcher(api, transactionHash).fetch(
      WalletStatusFetcherTimeout,
      WalletStatusFetcherDelay
    )
    receipt.transactionStatus = transactionStatus
    switch (transactionStatus) {
      case EVMTransactionStatus.Failure: {
        this.status = NetworkOperationStatus.Error
        break
      }
      case EVMTransactionStatus.Pending: {
        this.status = NetworkOperationStatus.Timeout
        break
      }
      case EVMTransactionStatus.Unknown: {
        this.status = NetworkOperationStatus.Timeout
        break
      }
    }
    return transactionStatus === EVMTransactionStatus.Success
  }

  async trackJEVMTransaction (chainId: string, transactionId: string, type: TransactionType): Promise<boolean> {
    const api = this.provider.jevmApi[chainId]
    const receipt = new TransactionReceipt(api.chain.id, type, JEVMTransactionStatus.Processing, transactionId)
    this.receipts.push(receipt)
    const transactionStatus = await new JEVMTransactionStatusFetcher(api, transactionId).fetch(
      WalletStatusFetcherTimeout,
      WalletStatusFetcherDelay
    )
    receipt.transactionStatus = transactionStatus
    switch (transactionStatus) {
      case JEVMTransactionStatus.Dropped: {
        this.status = NetworkOperationStatus.Error
        break
      }
      case JEVMTransactionStatus.Processing: {
        this.status = NetworkOperationStatus.Timeout
        break
      }
      case JEVMTransactionStatus.Unknown: {
        this.status = NetworkOperationStatus.Timeout
        break
      }
    }
    return transactionStatus === JEVMTransactionStatus.Accepted
  }

  async trackPlatformTransaction (transactionId: string, type: TransactionType): Promise<boolean> {
    const receipt = new TransactionReceipt(
      this.provider.platformChain.id,
      type,
      PlatformTransactionStatus.Processing,
      transactionId
    )
    this.receipts.push(receipt)
    const transactionStatus = await new PlatformTransactionStatusFetcher(
      this.provider.platformApi,
      transactionId
    ).fetch(WalletStatusFetcherTimeout, WalletStatusFetcherDelay)
    receipt.transactionStatus = transactionStatus
    switch (transactionStatus) {
      case PlatformTransactionStatus.Dropped: {
        this.status = NetworkOperationStatus.Error
        break
      }
      case PlatformTransactionStatus.Processing: {
        this.status = NetworkOperationStatus.Timeout
        break
      }
      case PlatformTransactionStatus.Unknown: {
        this.status = NetworkOperationStatus.Timeout
        break
      }
    }
    return transactionStatus === PlatformTransactionStatus.Committed
  }

  async trackJVMTransaction (transactionId: string, type: TransactionType): Promise<boolean> {
    const receipt = new TransactionReceipt(
      this.provider.jvmChain.id,
      type,
      JVMTransactionStatus.Processing,
      transactionId
    )
    this.receipts.push(receipt)
    const transactionStatus = await new JVMTransactionStatusFetcher(this.provider.jvmApi, transactionId).fetch(
      WalletStatusFetcherTimeout,
      WalletStatusFetcherDelay
    )
    receipt.transactionStatus = transactionStatus
    switch (transactionStatus) {
      case JVMTransactionStatus.Processing: {
        this.status = NetworkOperationStatus.Timeout
        break
      }
      case JVMTransactionStatus.Unknown: {
        this.status = NetworkOperationStatus.Timeout
        break
      }
    }
    return transactionStatus === JVMTransactionStatus.Accepted
  }
}
