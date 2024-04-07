import { type MCNProvider } from '../../juneo'
import {
  TransactionType,
  type UtxoFeeData,
  type UtxoSpending,
  estimateSendOperation,
  estimateSendUtxoOperation
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
import { type MCNWallet } from '../wallet'
import { UtxoAccount } from './account'

export class JVMAccount extends UtxoAccount {
  provider: MCNProvider

  constructor (provider: MCNProvider, wallet: MCNWallet) {
    super(provider.jvm.chain, provider.jvm, wallet)
    this.provider = provider
  }

  async estimate (operation: ChainNetworkOperation): Promise<ChainOperationSummary> {
    if (operation.type === NetworkOperationType.Send) {
      return await estimateSendOperation(this.provider, this.chain, this, operation as SendOperation)
    } else if (operation.type === NetworkOperationType.SendUtxo) {
      return await estimateSendUtxoOperation(this.provider, this.chain, this, operation as SendUtxoOperation)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (summary: ChainOperationSummary): Promise<void> {
    super.spend(summary.spendings as UtxoSpending[])
    const executable: ExecutableOperation = summary.getExecutable()
    const operation: ChainNetworkOperation = summary.operation
    if (operation.type === NetworkOperationType.Send) {
      const transaction: string = (summary.fee as UtxoFeeData).transaction.signTransaction(this.signers).toCHex()
      const transactionHash: string = (await this.provider.jvm.issueTx(transaction)).txID
      await executable.addTrackedJVMTransaction(this.provider.jvm, TransactionType.Send, transactionHash)
    } else if (operation.type === NetworkOperationType.SendUtxo) {
      const transaction: string = (summary.fee as UtxoFeeData).transaction.signTransaction(this.signers).toCHex()
      const transactionHash: string = (await this.provider.jvm.issueTx(transaction)).txID
      await executable.addTrackedJVMTransaction(this.provider.jvm, TransactionType.Send, transactionHash)
    }
    // balances fetching is needed to get new utxos created from this operation
    await super.refreshBalances()
  }
}
