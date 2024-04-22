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
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (summary: ChainOperationSummary): Promise<void> {
    super.spend(summary.spendings as UtxoSpending[])
    const executable: ExecutableOperation = summary.getExecutable()
    const operation: ChainNetworkOperation = summary.operation
    if (operation.type === NetworkOperationType.ValidatePrimary) {
      const transaction: string = (summary.fee as UtxoFeeData).transaction.signTransaction([this.chainWallet]).toCHex()
      const transactionId: string = (await executable.provider.platformApi.issueTx(transaction)).txID
      await executable.addTrackedPlatformTransaction(TransactionType.PrimaryValidation, transactionId)
    } else if (operation.type === NetworkOperationType.DelegatePrimary) {
      const transaction: string = (summary.fee as UtxoFeeData).transaction.signTransaction([this.chainWallet]).toCHex()
      const transactionId: string = (await executable.provider.platformApi.issueTx(transaction)).txID
      await executable.addTrackedPlatformTransaction(TransactionType.PrimaryDelegation, transactionId)
    } else if (operation.type === NetworkOperationType.Send) {
      const transaction: string = (summary.fee as UtxoFeeData).transaction.signTransaction(this.signers).toCHex()
      const transactionHash: string = (await executable.provider.platformApi.issueTx(transaction)).txID
      await executable.addTrackedPlatformTransaction(TransactionType.Send, transactionHash)
    } else if (operation.type === NetworkOperationType.SendUtxo) {
      const transaction: string = (summary.fee as UtxoFeeData).transaction.signTransaction(this.signers).toCHex()
      const transactionHash: string = (await executable.provider.platformApi.issueTx(transaction)).txID
      await executable.addTrackedPlatformTransaction(TransactionType.Send, transactionHash)
    }
    // balances fetching is needed to get new utxos creating from this operation
    await super.refreshBalances()
  }
}
