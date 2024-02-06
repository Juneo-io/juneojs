import { type MCNProvider } from '../../juneo'
import {
  TransactionType,
  type UtxoFeeData,
  type UtxoSpending,
  estimatePlatformValidateOperation,
  estimatePlatformDelegateOperation
} from '../transaction'
import { AccountError } from '../../utils'
import {
  type ExecutableOperation,
  NetworkOperationType,
  type ChainOperationSummary,
  type DelegateOperation,
  type ValidateOperation,
  type ChainNetworkOperation
} from '../operation'
import { StakeManager } from '../stake'
import { type MCNWallet } from '../wallet'
import { UtxoAccount } from './account'

export class PlatformAccount extends UtxoAccount {
  provider: MCNProvider
  private readonly stakeManager: StakeManager

  constructor (provider: MCNProvider, wallet: MCNWallet) {
    super(provider.platform.chain, provider.platform, wallet)
    this.chain = provider.platform.chain
    this.provider = provider
    this.stakeManager = new StakeManager(provider, this.chainWallet)
  }

  async estimate (operation: ChainNetworkOperation): Promise<ChainOperationSummary> {
    if (operation.type === NetworkOperationType.Validate) {
      return await estimatePlatformValidateOperation(
        this.provider,
        this.chainWallet,
        operation as ValidateOperation,
        this
      )
    } else if (operation.type === NetworkOperationType.Delegate) {
      return await estimatePlatformDelegateOperation(
        this.provider,
        this.chainWallet,
        operation as DelegateOperation,
        this
      )
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (summary: ChainOperationSummary): Promise<void> {
    super.spend(summary.spendings as UtxoSpending[])
    const executable: ExecutableOperation = summary.getExecutable()
    const operation: ChainNetworkOperation = summary.operation
    if (operation.type === NetworkOperationType.Validate) {
      const staking: ValidateOperation = operation as ValidateOperation
      const transactionId: string = await this.stakeManager.validate(
        staking.nodeId,
        staking.amount,
        staking.startTime,
        staking.endTime,
        summary.fee as UtxoFeeData,
        this.utxoSet
      )
      await executable.addTrackedPlatformTransaction(
        this.provider.platform,
        TransactionType.PrimaryValidation,
        transactionId
      )
    } else if (operation.type === NetworkOperationType.Delegate) {
      const staking: DelegateOperation = operation as DelegateOperation
      const transactionId: string = await this.stakeManager.delegate(
        staking.nodeId,
        staking.amount,
        staking.startTime,
        staking.endTime,
        summary.fee as UtxoFeeData,
        this.utxoSet
      )
      await executable.addTrackedPlatformTransaction(
        this.provider.platform,
        TransactionType.PrimaryDelegation,
        transactionId
      )
    }
    // balances fetching is needed to get new utxos creating from this operation
    await super.refreshBalances()
  }
}
