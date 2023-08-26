import { type PlatformAPI } from '../../api'
import { type PlatformBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { TransactionType, type FeeData, type UtxoFeeData, UtxoSpending } from '../transaction'
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
      const fee: UtxoFeeData = await this.stakeManager.estimateValidationFee(staking.nodeId, staking.amount, staking.startTime, staking.endTime, super.utxoSet)
      const stakePeriod: bigint = staking.endTime - staking.startTime
      const potentialReward: bigint = this.stakeManager.estimateValidationReward(stakePeriod, staking.amount)
      return new StakingOperationSummary(staking, this.chain, [fee],
        [new UtxoSpending(this.chain.id, staking.amount, this.chain.assetId, super.getUtxos(fee.transaction)), fee], potentialReward
      )
    } else if (operation.type === MCNOperationType.Delegate) {
      const staking: DelegateOperation = operation as DelegateOperation
      const fee: UtxoFeeData = await this.stakeManager.estimateDelegationFee(staking.nodeId, staking.amount, staking.startTime, staking.endTime, super.utxoSet)
      const stakePeriod: bigint = staking.endTime - staking.startTime
      const potentialReward: bigint = this.stakeManager.estimateDelegationReward(stakePeriod, staking.amount)
      return new StakingOperationSummary(staking, this.chain, [fee],
        [new UtxoSpending(this.chain.id, staking.amount, this.chain.assetId, super.getUtxos(fee.transaction)), fee], potentialReward
      )
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (executable: ExecutableMCNOperation): Promise<void> {
    super.spend(executable.summary.spendings as UtxoSpending[])
    const operation: MCNOperation = executable.summary.operation
    if (operation.type === MCNOperationType.Validate) {
      const staking: ValidateOperation = operation as ValidateOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionId: string = await this.stakeManager.validate(staking.nodeId, staking.amount, staking.startTime, staking.endTime, fees[i] as UtxoFeeData, this.utxoSet)
        const success: boolean = await executable.addTrackedPlatformTransaction(this.api, TransactionType.PrimaryValidation, transactionId)
        if (!success) {
          break
        }
      }
    } else if (operation.type === MCNOperationType.Delegate) {
      const staking: DelegateOperation = operation as DelegateOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionId: string = await this.stakeManager.delegate(staking.nodeId, staking.amount, staking.startTime, staking.endTime, fees[i] as UtxoFeeData, this.utxoSet)
        const success: boolean = await executable.addTrackedPlatformTransaction(this.api, TransactionType.PrimaryDelegation, transactionId)
        if (!success) {
          break
        }
      }
    }
    // balances fetching is needed to get new utxos creating from this operation
    await super.fetchBalances()
  }
}
