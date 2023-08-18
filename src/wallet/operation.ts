import { type ethers } from 'ethers'
import { type Blockchain } from '../chain'
import { EVMTransactionStatus, EVMTransactionStatusFetcher, type FeeData } from '../transaction'
import { type JEVMAPI } from '../api'
import { type TransactionReceipt } from './common'

export enum MCNOperationType {
  Transfer = 'Base transfer',
  Cross = 'Cross chain transfer',
  Bridge = 'Bridge transfer',
  Validate = 'Validate',
  Delegate = 'Delegate',
  Wrap = 'Wrap',
  Unwrap = 'Unwrap',
  Unsupported = 'Unsupported operation'
}

export interface MCNOperation {
  type: MCNOperationType
}

export class MCNOperationSummary {
  operation: MCNOperation
  chain: Blockchain
  fees: FeeData[]

  constructor (operation: MCNOperation, chain: Blockchain, fees: FeeData[]) {
    this.operation = operation
    this.chain = chain
    this.fees = fees
  }
}

export class ExecutableMCNOperation {
  summary: MCNOperationSummary
  status: MCNOperationStatus = MCNOperationStatus.Initializing
  receipts: TransactionReceipt[] = []

  constructor (summary: MCNOperationSummary) {
    this.summary = summary
  }

  async executeEVMTransaction (api: JEVMAPI, wallet: ethers.Wallet): Promise<void> {
    // if (this.status !== MCNOperationStatus.Executing) {
    //     this.status = MCNOperationStatus.Executing
    // }
    // const receipt: TransactionReceipt = new TransactionReceipt(api.chain.id, TransactionType.Wrap)
    // this.receipts.push(receipt)
    // const transactionData: ethers.TransactionRequest = {
    //   from: wallet.address,
    //   to: wrapping.asset.address,
    //   value: wrapping.amount,
    //   nonce: Number(nonce++),
    //   chainId: chain.chainId,
    //   gasLimit: feeData.gasLimit,
    //   gasPrice: feeData.gasPrice,
    //   data
    // }
    // const transaction: string = await wallet.signTransaction(transactionData)
    // const transactionHash: string = await api.eth_sendRawTransaction(transaction).catch(error => {
    //   throw error
    // })
    // receipt.transactionId = transactionHash
    // receipt.transactionStatus = EVMTransactionStatus.Unknown
    // const transactionStatus: string = await new EVMTransactionStatusFetcher(api,
    //   WalletStatusFetcherDelay, WalletStatusFetcherMaxAttempts, transactionHash).fetch()
    // receipt.transactionStatus = transactionStatus
    // if (transactionStatus === EVMTransactionStatus.Failure) {
    //   this.status = MCNOperationStatus.Error
    // } else {
    //   this.status = MCNOperationStatus.Timeout
    // }
  }
}

export enum MCNOperationStatus {
  Initializing = 'Initializing',
  Executing = 'Executing',
  Done = 'Done',
  Timeout = 'Timeout',
  Error = 'Error'
}
