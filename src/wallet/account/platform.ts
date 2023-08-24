import { type PlatformAPI } from '../../api'
import { type PlatformBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { Spending, TransactionType, type FeeData } from '../transaction'
import { AccountError } from '../../utils'
import { type ExecutableMCNOperation, type MCNOperation, type MCNOperationSummary, MCNOperationType } from '../operation'
import { type DelegateOperation, StakeManager, StakingOperationSummary, type ValidateOperation } from '../stake'
import { type JuneoWallet } from '../wallet'
import { UtxoAccount } from './account'

export class PlatformAccount extends UtxoAccount {
  override chain: PlatformBlockchain
  api: PlatformAPI
  private readonly stakeManager: StakeManager

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    super(provider.platform.chain, provider.platform, wallet)
    this.chain = provider.platform.chain
    this.api = provider.platform
    this.stakeManager = new StakeManager(provider, this.chainWallet)
  }

  async estimate (operation: MCNOperation): Promise<MCNOperationSummary> {
    if (operation.type === MCNOperationType.Validate) {
      const staking: ValidateOperation = operation as ValidateOperation
      const fee: FeeData = await this.stakeManager.estimateValidationFee()
      const stakePeriod: bigint = staking.endTime - staking.startTime
      const potentialReward: bigint = this.stakeManager.estimateValidationReward(stakePeriod, staking.amount)
      return new StakingOperationSummary(staking, this.chain, [fee], [new Spending(this.chain.id, staking.amount, this.chain.assetId), fee], potentialReward)
    } else if (operation.type === MCNOperationType.Delegate) {
      const staking: DelegateOperation = operation as DelegateOperation
      const fee: FeeData = await this.stakeManager.estimateDelegationFee()
      const stakePeriod: bigint = staking.endTime - staking.startTime
      const potentialReward: bigint = this.stakeManager.estimateDelegationReward(stakePeriod, staking.amount)
      return new StakingOperationSummary(staking, this.chain, [fee], [new Spending(this.chain.id, staking.amount, this.chain.assetId), fee], potentialReward)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (executable: ExecutableMCNOperation): Promise<void> {
    const operation: MCNOperation = executable.summary.operation
    if (operation.type === MCNOperationType.Validate) {
      const staking: ValidateOperation = operation as ValidateOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionId: string = await this.stakeManager.validate(staking.nodeId, staking.amount, staking.startTime, staking.endTime, fees[i], this.utxoSet)
        const success: boolean = await executable.addTrackedPlatformTransaction(this.api, TransactionType.PrimaryValidation, transactionId)
        if (!success) {
          break
        }
      }
    } else if (operation.type === MCNOperationType.Delegate) {
      const staking: DelegateOperation = operation as DelegateOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionId: string = await this.stakeManager.delegate(staking.nodeId, staking.amount, staking.startTime, staking.endTime, fees[i], this.utxoSet)
        const success: boolean = await executable.addTrackedPlatformTransaction(this.api, TransactionType.PrimaryDelegation, transactionId)
        if (!success) {
          break
        }
      }
    }
  }
}
