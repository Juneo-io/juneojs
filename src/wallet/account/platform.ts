import { type MCNProvider } from '../../juneo'
import { TransactionType, type FeeData, type UtxoFeeData, type UtxoSpending, estimatePlatformValidateOperation, estimatePlatformDelegateOperation } from '../transaction'
import { AccountError } from '../../utils'
import { type ExecutableMCNOperation, type NetworkOperation, type MCNOperationSummary, NetworkOperationType } from '../operation'
import { type DelegateOperation, StakeManager, type ValidateOperation } from '../stake'
import { type JuneoWallet } from '../wallet'
import { UtxoAccount } from './account'

export class PlatformAccount extends UtxoAccount {
  provider: MCNProvider
  private readonly stakeManager: StakeManager

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    super(provider.platform.chain, provider.platform, wallet)
    this.chain = provider.platform.chain
    this.provider = provider
    this.stakeManager = new StakeManager(provider, this.chainWallet)
  }

  async estimate (operation: NetworkOperation): Promise<MCNOperationSummary> {
    if (operation.type === NetworkOperationType.Validate) {
      return await estimatePlatformValidateOperation(this.provider, this.wallet, operation as ValidateOperation, this)
    } else if (operation.type === NetworkOperationType.Delegate) {
      return await estimatePlatformDelegateOperation(this.provider, this.wallet, operation as DelegateOperation, this)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (executable: ExecutableMCNOperation): Promise<void> {
    super.spend(executable.summary.spendings as UtxoSpending[])
    const operation: NetworkOperation = executable.summary.operation
    if (operation.type === NetworkOperationType.Validate) {
      const staking: ValidateOperation = operation as ValidateOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionId: string = await this.stakeManager.validate(
          staking.nodeId, staking.amount, staking.startTime, staking.endTime, fees[i] as UtxoFeeData, this.utxoSet
        ).catch(error => {
          throw error
        })
        const success: boolean = await executable.addTrackedPlatformTransaction(this.provider.platform, TransactionType.PrimaryValidation, transactionId)
        if (!success) {
          break
        }
      }
    } else if (operation.type === NetworkOperationType.Delegate) {
      const staking: DelegateOperation = operation as DelegateOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionId: string = await this.stakeManager.delegate(
          staking.nodeId, staking.amount, staking.startTime, staking.endTime, fees[i] as UtxoFeeData, this.utxoSet
        ).catch(error => {
          throw error
        })
        const success: boolean = await executable.addTrackedPlatformTransaction(this.provider.platform, TransactionType.PrimaryDelegation, transactionId)
        if (!success) {
          break
        }
      }
    }
    // balances fetching is needed to get new utxos creating from this operation
    await super.fetchAllBalances()
  }
}
