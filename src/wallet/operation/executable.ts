import { type JEVMAPI, type PlatformAPI, type JVMAPI } from '../../api'
import {
  EVMTransactionStatus, EVMTransactionStatusFetcher, JEVMTransactionStatus, JEVMTransactionStatusFetcher,
  PlatformTransactionStatus, PlatformTransactionStatusFetcher, JVMTransactionStatus, JVMTransactionStatusFetcher
} from '../../transaction'
import { type TransactionType, WalletStatusFetcherTimeout, WalletStatusFetcherDelay, TransactionReceipt } from '../transaction'
import { NetworkOperationStatus } from './operation'

export class ExecutableMCNOperation {
  status: NetworkOperationStatus = NetworkOperationStatus.Initializing
  receipts: TransactionReceipt[] = []

  async addTrackedEVMTransaction (api: JEVMAPI, type: TransactionType, transactionHash: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, type, EVMTransactionStatus.Pending, transactionHash)
    this.receipts.push(receipt)
    const transactionStatus: string = await new EVMTransactionStatusFetcher(api, transactionHash)
      .fetch(WalletStatusFetcherTimeout, WalletStatusFetcherDelay)
      .catch(error => {
        this.status = NetworkOperationStatus.Error
        throw error
      })
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === EVMTransactionStatus.Failure) {
      this.status = NetworkOperationStatus.Error
    } else if (transactionStatus !== EVMTransactionStatus.Success) {
      this.status = NetworkOperationStatus.Timeout
    }
    return transactionStatus === EVMTransactionStatus.Success
  }

  async addTrackedJEVMTransaction (api: JEVMAPI, type: TransactionType, transactionId: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, type, JEVMTransactionStatus.Processing, transactionId)
    this.receipts.push(receipt)
    const transactionStatus: string = await new JEVMTransactionStatusFetcher(api, transactionId)
      .fetch(WalletStatusFetcherTimeout, WalletStatusFetcherDelay)
      .catch(error => {
        this.status = NetworkOperationStatus.Error
        throw error
      })
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === JEVMTransactionStatus.Dropped) {
      this.status = NetworkOperationStatus.Error
    } else if (transactionStatus !== JEVMTransactionStatus.Accepted) {
      this.status = NetworkOperationStatus.Timeout
    }
    return transactionStatus === JEVMTransactionStatus.Accepted
  }

  async addTrackedPlatformTransaction (api: PlatformAPI, type: TransactionType, transactionId: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, type, PlatformTransactionStatus.Processing, transactionId)
    this.receipts.push(receipt)
    const transactionStatus: string = await new PlatformTransactionStatusFetcher(api, transactionId)
      .fetch(WalletStatusFetcherTimeout, WalletStatusFetcherDelay)
      .catch(error => {
        this.status = NetworkOperationStatus.Error
        throw error
      })
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === PlatformTransactionStatus.Dropped || transactionStatus === PlatformTransactionStatus.Aborted) {
      this.status = NetworkOperationStatus.Error
    } else if (transactionStatus !== PlatformTransactionStatus.Committed) {
      this.status = NetworkOperationStatus.Timeout
    }
    return transactionStatus === PlatformTransactionStatus.Committed
  }

  async addTrackedJVMTransaction (api: JVMAPI, type: TransactionType, transactionId: string): Promise<boolean> {
    const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, type, JVMTransactionStatus.Processing, transactionId)
    this.receipts.push(receipt)
    const transactionStatus: string = await new JVMTransactionStatusFetcher(api, transactionId)
      .fetch(WalletStatusFetcherTimeout, WalletStatusFetcherDelay)
      .catch(error => {
        this.status = NetworkOperationStatus.Error
        throw error
      })
    receipt.transactionStatus = transactionStatus
    if (transactionStatus === JVMTransactionStatus.Unknown) {
      this.status = NetworkOperationStatus.Error
    } else if (transactionStatus !== JVMTransactionStatus.Accepted) {
      this.status = NetworkOperationStatus.Timeout
    }
    return transactionStatus === JVMTransactionStatus.Accepted
  }
}
