import { type MCNProvider } from '../../juneo'
import {
  TransactionType,
  type UtxoFeeData,
  type UtxoSpending,
  estimateJVMSendOperation,
  estimateJVMSendUtxoOperation
} from '../transaction'
import { AccountError } from '../../utils'
import {
  type ExecutableOperation,
  NetworkOperationType,
  type ChainOperationSummary,
  type SendOperation,
  type ChainNetworkOperation,
  type SendUtxoOperation
} from '../operation'
import { SendManager } from '../send'
import { type MCNWallet } from '../wallet'
import { UtxoAccount } from './account'

export class JVMAccount extends UtxoAccount {
  provider: MCNProvider
  private readonly sendManager: SendManager

  constructor (provider: MCNProvider, wallet: MCNWallet) {
    super(provider.jvm.chain, provider.jvm, wallet)
    this.chain = provider.jvm.chain
    this.provider = provider
    this.sendManager = new SendManager(provider)
  }

  async estimate (operation: ChainNetworkOperation): Promise<ChainOperationSummary> {
    if (operation.type === NetworkOperationType.Send) {
      return await estimateJVMSendOperation(this.provider, this, operation as SendOperation)
    } else if (operation.type === NetworkOperationType.SendUtxo) {
      return await estimateJVMSendUtxoOperation(this.provider, this, operation as SendUtxoOperation)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (summary: ChainOperationSummary): Promise<void> {
    super.spend(summary.spendings as UtxoSpending[])
    const executable: ExecutableOperation = summary.getExecutable()
    const operation: ChainNetworkOperation = summary.operation
    if (operation.type === NetworkOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const transactionHash: string = await this.sendManager.sendJVM(
        this,
        send.assetId,
        send.amount,
        [send.address],
        1,
        summary.fee as UtxoFeeData
      )
      await executable.addTrackedJVMTransaction(this.provider.jvm, TransactionType.Send, transactionHash)
    } else if (operation.type === NetworkOperationType.SendUtxo) {
      const send: SendUtxoOperation = operation as SendUtxoOperation
      const transactionHash: string = await this.sendManager.sendJVM(
        this,
        send.assetId,
        send.amount,
        send.addresses,
        send.threshold,
        summary.fee as UtxoFeeData,
        send.locktime
      )
      await executable.addTrackedJVMTransaction(this.provider.jvm, TransactionType.Send, transactionHash)
    }
    // balances fetching is needed to get new utxos creating from this operation
    await super.refreshBalances()
  }
}
