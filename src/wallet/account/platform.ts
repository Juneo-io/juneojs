import { type MCNProvider } from '../../juneo'
import {
  type AddPermissionlessDelegatorTransaction,
  type AddPermissionlessValidatorTransaction,
  type AddSupernetValidatorTransaction,
  type Validator
} from '../../transaction'
import { AccountError, StakeError, TimeUtils } from '../../utils'
import {
  type AddSupernetValidatorOperation,
  type ChainNetworkOperation,
  type ChainOperationSummary,
  type CreateChainOperation,
  type CreateSupernetOperation,
  type DelegatePrimaryOperation,
  type DonationOperation,
  NetworkOperationType,
  type RemoveSupernetValidatorOperation,
  type SendOperation,
  type SendUtxoOperation,
  type ValidatePrimaryOperation
} from '../operation'
import {
  TransactionType,
  type UtxoFeeData,
  type UtxoSpending,
  estimatePlatformAddSupernetValidatorOperation,
  estimatePlatformCreateChainOperation,
  estimatePlatformCreateSupernetOperation,
  estimatePlatformDelegatePrimaryOperation,
  estimatePlatformDonationOperation,
  estimatePlatformRemoveSupernetValidatorOperation,
  estimatePlatformValidatePrimaryOperation,
  estimateSendOperation,
  estimateSendUtxoOperation
} from '../transaction'
import { type MCNWallet } from '../wallet'
import { UtxoAccount } from './account'

export class PlatformAccount extends UtxoAccount {
  private readonly provider: MCNProvider

  constructor (provider: MCNProvider, wallet: MCNWallet) {
    super(provider.platformChain, provider.platformApi, wallet)
    this.chain = provider.platformChain
    this.provider = provider
  }

  async estimate (operation: ChainNetworkOperation): Promise<ChainOperationSummary> {
    const provider = await this.provider.getStaticProvider()
    if (operation.type === NetworkOperationType.ValidatePrimary) {
      return await estimatePlatformValidatePrimaryOperation(provider, operation as ValidatePrimaryOperation, this)
    } else if (operation.type === NetworkOperationType.DelegatePrimary) {
      return await estimatePlatformDelegatePrimaryOperation(provider, operation as DelegatePrimaryOperation, this)
    } else if (operation.type === NetworkOperationType.Send) {
      return await estimateSendOperation(provider, this.chain, this, operation as SendOperation)
    } else if (operation.type === NetworkOperationType.SendUtxo) {
      return await estimateSendUtxoOperation(provider, this.chain, this, operation as SendUtxoOperation)
    } else if (operation.type === NetworkOperationType.CreateSupernet) {
      return await estimatePlatformCreateSupernetOperation(provider, operation as CreateSupernetOperation, this)
    } else if (operation.type === NetworkOperationType.ValidateSupernet) {
      return await estimatePlatformAddSupernetValidatorOperation(
        provider,
        operation as AddSupernetValidatorOperation,
        this
      )
    } else if (operation.type === NetworkOperationType.RemoveSupernetValidator) {
      return await estimatePlatformRemoveSupernetValidatorOperation(
        provider,
        operation as RemoveSupernetValidatorOperation,
        this
      )
    } else if (operation.type === NetworkOperationType.CreateChain) {
      return await estimatePlatformCreateChainOperation(provider, operation as CreateChainOperation, this)
    } else if (operation.type === NetworkOperationType.Donation) {
      return await estimatePlatformDonationOperation(provider, operation as DonationOperation, this)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (summary: ChainOperationSummary): Promise<void> {
    super.spend(summary.spendings as UtxoSpending[])
    const operation = summary.operation.type
    if (operation === NetworkOperationType.ValidatePrimary) {
      const transaction = (summary.fee as UtxoFeeData).transaction as AddPermissionlessValidatorTransaction
      this.verifyAndFixStakeTransaction(transaction.validator)
      await this.executeAndTrackTransaction(summary, TransactionType.PrimaryValidation)
    } else if (operation === NetworkOperationType.DelegatePrimary) {
      const transaction = (summary.fee as UtxoFeeData).transaction as AddPermissionlessDelegatorTransaction
      this.verifyAndFixStakeTransaction(transaction.validator)
      await this.executeAndTrackTransaction(summary, TransactionType.PrimaryDelegation)
    } else if (operation === NetworkOperationType.Send) {
      await this.executeAndTrackTransaction(summary, TransactionType.Send)
    } else if (operation === NetworkOperationType.SendUtxo) {
      await this.executeAndTrackTransaction(summary, TransactionType.Send)
    } else if (operation === NetworkOperationType.CreateSupernet) {
      await this.executeAndTrackTransaction(summary, TransactionType.CreateSupernet)
    } else if (operation === NetworkOperationType.ValidateSupernet) {
      const transaction = (summary.fee as UtxoFeeData).transaction as AddSupernetValidatorTransaction
      this.verifyAndFixStakeTransaction(transaction.validator)
      await this.executeAndTrackTransaction(summary, TransactionType.ValidateSupernet)
    } else if (operation === NetworkOperationType.RemoveSupernetValidator) {
      await this.executeAndTrackTransaction(summary, TransactionType.RemoveSupernetValidator)
    } else if (operation === NetworkOperationType.CreateChain) {
      await this.executeAndTrackTransaction(summary, TransactionType.CreateChain)
    } else if (operation === NetworkOperationType.Donation) {
      await this.executeAndTrackTransaction(summary, TransactionType.Donation)
    }
    // balances fetching is needed to get new utxos creating from this operation
    await super.refreshBalances()
  }

  // Doing the check and fix here before a rework of unsignedTx usage in op summaries.
  // This avoids to send tx with too low staking period which can easily happen when
  // users are trying to stake for staking periods of minStakeDuration.
  private verifyAndFixStakeTransaction (validator: Validator): void {
    const minStakeDuration = this.provider.platformChain.stakeConfig.minStakeDuration
    // if the stake period the user entered is too low it is better to throw an error than
    // adjusting it and sending it so it does not have an unexpected behaviour
    if (validator.getStakePeriod() < minStakeDuration) {
      throw new StakeError(
        `stake period of ${validator.getStakePeriod()} is too low: want at least ${minStakeDuration}`
      )
    }
    // resync of start time to match chain timestamp
    // note: maybe use actual chain timestamp instead of local user time
    // some may have reconfigured their clock
    validator.startTime = TimeUtils.now()
    // resync endTime to accomodate for minStakeDuration according to new startTime
    // give it an extra 60 seconds headroom to make sure the staking does not fail
    if (validator.getStakePeriod() < minStakeDuration) {
      validator.endTime = validator.startTime + minStakeDuration + BigInt(60)
    }
  }

  private async executeAndTrackTransaction (summary: ChainOperationSummary, type: TransactionType): Promise<void> {
    const executable = summary.getExecutable()
    const signedTx = await (summary.fee as UtxoFeeData).transaction.signTransaction(this.signers)
    const transactionHash = (await executable.provider.platformApi.issueTx(signedTx)).txID
    await executable.trackPlatformTransaction(transactionHash, type)
  }
}
