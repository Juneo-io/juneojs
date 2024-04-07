import { type MCNProvider } from '../../juneo'
import {
  TransactionType,
  type UtxoFeeData,
  type UtxoSpending,
  estimatePlatformValidatePrimaryOperation,
  estimatePlatformDelegatePrimaryOperation,
  estimateSendOperation,
  estimateSendUtxoOperation
} from '../transaction'
import { AccountError } from '../../utils'
import {
  type ExecutableOperation,
  NetworkOperationType,
  type ChainOperationSummary,
  type DelegatePrimaryOperation,
  type ValidatePrimaryOperation,
  type ChainNetworkOperation,
  type SendOperation,
  type SendUtxoOperation
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
    } else if (operation.type === NetworkOperationType.Send) {
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
    } else if (operation.type === NetworkOperationType.Send) {
      const transaction: string = (summary.fee as UtxoFeeData).transaction.signTransaction(this.signers).toCHex()
      const transactionHash: string = (await this.provider.platform.issueTx(transaction)).txID
      await executable.addTrackedPlatformTransaction(this.provider.platform, TransactionType.Send, transactionHash)
    } else if (operation.type === NetworkOperationType.SendUtxo) {
      const transaction: string = (summary.fee as UtxoFeeData).transaction.signTransaction(this.signers).toCHex()
      const transactionHash: string = (await this.provider.platform.issueTx(transaction)).txID
      await executable.addTrackedPlatformTransaction(this.provider.platform, TransactionType.Send, transactionHash)
    }
    // balances fetching is needed to get new utxos creating from this operation
    await super.refreshBalances()
  }
}
