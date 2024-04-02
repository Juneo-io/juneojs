import { type MCNProvider } from '../../juneo'
import {
  TransactionType,
  type UtxoFeeData,
  type UtxoSpending,
  estimatePlatformValidatePrimaryOperation,
  estimatePlatformDelegatePrimaryOperation
} from '../transaction'
import { AccountError } from '../../utils'
import {
  type ExecutableOperation,
  NetworkOperationType,
  type ChainOperationSummary,
  type DelegatePrimaryOperation,
  type ValidatePrimaryOperation,
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
    if (operation.type === NetworkOperationType.ValidatePrimary) {
      return await estimatePlatformValidatePrimaryOperation(this.provider, operation as ValidatePrimaryOperation, this)
    } else if (operation.type === NetworkOperationType.DelegatePrimary) {
      return await estimatePlatformDelegatePrimaryOperation(this.provider, operation as DelegatePrimaryOperation, this)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (summary: ChainOperationSummary): Promise<void> {
    super.spend(summary.spendings as UtxoSpending[])
    const executable: ExecutableOperation = summary.getExecutable()
    const operation: ChainNetworkOperation = summary.operation
    if (operation.type === NetworkOperationType.ValidatePrimary) {
      const staking: ValidatePrimaryOperation = operation as ValidatePrimaryOperation
      const transactionId: string = await this.stakeManager.validate(
        staking.amount,
        staking.startTime,
        staking.endTime,
        summary.fee as UtxoFeeData
      )
      await executable.addTrackedPlatformTransaction(
        this.provider.platform,
        TransactionType.PrimaryValidation,
        transactionId
      )
    } else if (operation.type === NetworkOperationType.DelegatePrimary) {
      const staking: DelegatePrimaryOperation = operation as DelegatePrimaryOperation
      const transactionId: string = await this.stakeManager.delegate(
        staking.amount,
        staking.startTime,
        staking.endTime,
        summary.fee as UtxoFeeData
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
