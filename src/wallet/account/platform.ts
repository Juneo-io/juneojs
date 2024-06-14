import { type MCNProvider } from '../../juneo'
import { AccountError } from '../../utils'
import {
  type AddSupernetValidatorOperation,
  type ChainNetworkOperation,
  type ChainOperationSummary,
  type CreateChainOperation,
  type CreateSupernetOperation,
  type DelegatePrimaryOperation,
  type ExecutableOperation,
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
    const provider: MCNProvider = await this.provider.getStaticProvider()
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
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (summary: ChainOperationSummary): Promise<void> {
    super.spend(summary.spendings as UtxoSpending[])
    const operation: NetworkOperationType = summary.operation.type
    if (operation === NetworkOperationType.ValidatePrimary) {
      await this.executeAndTrackTransaction(summary, TransactionType.PrimaryValidation)
    } else if (operation === NetworkOperationType.DelegatePrimary) {
      await this.executeAndTrackTransaction(summary, TransactionType.PrimaryDelegation)
    } else if (operation === NetworkOperationType.Send) {
      await this.executeAndTrackTransaction(summary, TransactionType.Send)
    } else if (operation === NetworkOperationType.SendUtxo) {
      await this.executeAndTrackTransaction(summary, TransactionType.Send)
    } else if (operation === NetworkOperationType.CreateSupernet) {
      await this.executeAndTrackTransaction(summary, TransactionType.CreateSupernet)
    } else if (operation === NetworkOperationType.ValidateSupernet) {
      await this.executeAndTrackTransaction(summary, TransactionType.ValidateSupernet)
    } else if (operation === NetworkOperationType.RemoveSupernetValidator) {
      await this.executeAndTrackTransaction(summary, TransactionType.RemoveSupernetValidator)
    } else if (operation === NetworkOperationType.CreateChain) {
      await this.executeAndTrackTransaction(summary, TransactionType.CreateChain)
    }
    // balances fetching is needed to get new utxos creating from this operation
    await super.refreshBalances()
  }

  private async executeAndTrackTransaction (summary: ChainOperationSummary, type: TransactionType): Promise<void> {
    const executable: ExecutableOperation = summary.getExecutable()
    const signedTx = await (summary.fee as UtxoFeeData).transaction.signTransaction(this.signers)
    const transactionHash: string = (await executable.provider.platformApi.issueTx(signedTx.toCHex())).txID
    await executable.trackPlatformTransaction(transactionHash, type)
  }
}
