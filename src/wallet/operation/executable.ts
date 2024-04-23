import { type JEVMAPI } from '../../api'
import { type MCNProvider } from '../../juneo'
import {
  EVMTransactionStatus,
  EVMTransactionStatusFetcher,
  JEVMTransactionStatus,
  JEVMTransactionStatusFetcher,
  PlatformTransactionStatus,
  PlatformTransactionStatusFetcher,
  JVMTransactionStatus,
  JVMTransactionStatusFetcher
} from '../../transaction'
import {
  type TransactionType,
  WalletStatusFetcherTimeout,
  WalletStatusFetcherDelay,
  TransactionReceipt
} from '../transaction'
import { NetworkOperationStatus } from './operation'

export class ExecutableOperation {
  provider: MCNProvider
  status: NetworkOperationStatus = NetworkOperationStatus.Initializing
  receipts: TransactionReceipt[] = []

  constructor (provider: MCNProvider) {
    this.provider = provider
  }

  async trackEVMTransaction (chainId: string, type: TransactionType, transactionHash: string): Promise<boolean> {
    const api: JEVMAPI = this.provider.jevmApi[chainId]
    const receipt: TransactionReceipt = new TransactionReceipt(
      api.chain.id,
      type,
      EVMTransactionStatus.Pending,
      transactionHash
    )
    this.receipts.push(receipt)
    const transactionStatus: string = await new EVMTransactionStatusFetcher(api, transactionHash).fetch(
      WalletStatusFetcherTimeout,
      WalletStatusFetcherDelay
    )
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === EVMTransactionStatus.Failure) {
      this.status = NetworkOperationStatus.Error
    } else if (transactionStatus !== EVMTransactionStatus.Success) {
      this.status = NetworkOperationStatus.Timeout
    }
    return transactionStatus === EVMTransactionStatus.Success
  }

  async trackJEVMTransaction (chainId: string, type: TransactionType, transactionId: string): Promise<boolean> {
    const api: JEVMAPI = this.provider.jevmApi[chainId]
    const receipt: TransactionReceipt = new TransactionReceipt(
      api.chain.id,
      type,
      JEVMTransactionStatus.Processing,
      transactionId
    )
    this.receipts.push(receipt)
    const transactionStatus: string = await new JEVMTransactionStatusFetcher(api, transactionId).fetch(
      WalletStatusFetcherTimeout,
      WalletStatusFetcherDelay
    )
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === JEVMTransactionStatus.Dropped) {
      this.status = NetworkOperationStatus.Error
    } else if (transactionStatus !== JEVMTransactionStatus.Accepted) {
      this.status = NetworkOperationStatus.Timeout
    }
    return transactionStatus === JEVMTransactionStatus.Accepted
  }

  async trackPlatformTransaction (type: TransactionType, transactionId: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(
      this.provider.platformChain.id,
      type,
      PlatformTransactionStatus.Processing,
      transactionId
    )
    this.receipts.push(receipt)
    const transactionStatus: string = await new PlatformTransactionStatusFetcher(
      this.provider.platformApi,
      transactionId
    ).fetch(WalletStatusFetcherTimeout, WalletStatusFetcherDelay)
    receipt.transactionStatus = transactionStatus
    if (
      transactionStatus === PlatformTransactionStatus.Dropped ||
      transactionStatus === PlatformTransactionStatus.Aborted
    ) {
      this.status = NetworkOperationStatus.Error
    } else if (transactionStatus !== PlatformTransactionStatus.Committed) {
      this.status = NetworkOperationStatus.Timeout
    }
    return transactionStatus === PlatformTransactionStatus.Committed
  }

  async trackJVMTransaction (type: TransactionType, transactionId: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(
      this.provider.jvmChain.id,
      type,
      JVMTransactionStatus.Processing,
      transactionId
    )
    this.receipts.push(receipt)
    const transactionStatus: string = await new JVMTransactionStatusFetcher(this.provider.jvmApi, transactionId).fetch(
      WalletStatusFetcherTimeout,
      WalletStatusFetcherDelay
    )
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === JVMTransactionStatus.Unknown) {
      this.status = NetworkOperationStatus.Error
    } else if (transactionStatus !== JVMTransactionStatus.Accepted) {
      this.status = NetworkOperationStatus.Timeout
    }
    return transactionStatus === JVMTransactionStatus.Accepted
  }
}
