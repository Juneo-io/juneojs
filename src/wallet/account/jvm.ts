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
    super(provider.jvmChain, provider.jvmApi, wallet)
    this.provider = provider
  }

  async estimate (operation: ChainNetworkOperation): Promise<ChainOperationSummary> {
    const provider: MCNProvider = await this.provider.getStaticProvider()
    if (operation.type === NetworkOperationType.Send) {
      return await estimateSendOperation(provider, this.chain, this, operation as SendOperation)
    } else if (operation.type === NetworkOperationType.SendUtxo) {
      return await estimateSendUtxoOperation(provider, this.chain, this, operation as SendUtxoOperation)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (summary: ChainOperationSummary): Promise<void> {
    super.spend(summary.spendings as UtxoSpending[])
    const operation: NetworkOperationType = summary.operation.type
    if (operation === NetworkOperationType.Send) {
      await this.executeAndTrackTransaction(summary, TransactionType.Send)
    } else if (operation === NetworkOperationType.SendUtxo) {
      await this.executeAndTrackTransaction(summary, TransactionType.Send)
    }
    // balances fetching is needed to get new utxos created from this operation
    await super.refreshBalances()
  }

  private async executeAndTrackTransaction (summary: ChainOperationSummary, type: TransactionType): Promise<void> {
    const executable: ExecutableOperation = summary.getExecutable()
    const transaction: string = (summary.fee as UtxoFeeData).transaction.signTransaction(this.signers).toCHex()
    const transactionHash: string = (await executable.provider.jvmApi.issueTx(transaction)).txID
    await executable.trackJVMTransaction(transactionHash, type)
  }
}
