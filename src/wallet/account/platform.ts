import { type InfoAPI, type PlatformAPI } from '../../api'
import { type PlatformBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { TransactionType, FeeData, type UtxoFeeData, UtxoSpending, FeeType, Spending } from '../transaction'
import { AccountError } from '../../utils'
import { type ExecutableMCNOperation, type MCNOperation, MCNOperationSummary, MCNOperationType } from '../operation'
import { type DelegateOperation, StakeManager, StakingOperationSummary, type ValidateOperation } from '../stake'
import { type JuneoWallet } from '../wallet'
import { UtxoAccount } from './account'

export class PlatformAccount extends UtxoAccount {
  override chain: PlatformBlockchain
  api: PlatformAPI
  private readonly info: InfoAPI
  private readonly stakeManager: StakeManager

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    super(provider.platform.chain, provider.platform, wallet)
    this.chain = provider.platform.chain
    this.api = provider.platform
    this.info = provider.info
    this.stakeManager = new StakeManager(provider, this.chainWallet)
  }

  async estimate (operation: MCNOperation): Promise<MCNOperationSummary> {
    if (operation.type === MCNOperationType.Validate) {
      const staking: ValidateOperation = operation as ValidateOperation
      const potentialReward: bigint = this.stakeManager.estimateValidationReward(staking.endTime - staking.startTime, staking.amount)
      await this.stakeManager.estimateValidationFee(staking.nodeId, staking.amount, staking.startTime, staking.endTime, super.utxoSet).then(fee => {
        return new StakingOperationSummary(staking, this.chain, [fee],
          [new UtxoSpending(this.chain.id, staking.amount, this.chain.assetId, super.getUtxos(fee.transaction)), fee], potentialReward
        )
      }, async () => {
        const fee: FeeData = new FeeData(this.chain, BigInt((await this.info.getTxFee()).addPrimaryNetworkValidatorFee), FeeType.ValidateFee)
        return new MCNOperationSummary(operation, this.chain, [fee], [new Spending(this.chain.id, staking.amount, this.chain.assetId), fee])
      })
    } else if (operation.type === MCNOperationType.Delegate) {
      const staking: DelegateOperation = operation as DelegateOperation
      const potentialReward: bigint = this.stakeManager.estimateDelegationReward(staking.endTime - staking.startTime, staking.amount)
      await this.stakeManager.estimateValidationFee(staking.nodeId, staking.amount, staking.startTime, staking.endTime, super.utxoSet).then(fee => {
        return new StakingOperationSummary(staking, this.chain, [fee],
          [new UtxoSpending(this.chain.id, staking.amount, this.chain.assetId, super.getUtxos(fee.transaction)), fee], potentialReward
        )
      }, async () => {
        const fee: FeeData = new FeeData(this.chain, BigInt((await this.info.getTxFee()).addPrimaryNetworkDelegatorFee), FeeType.DelegateFee)
        return new MCNOperationSummary(operation, this.chain, [fee], [new Spending(this.chain.id, staking.amount, this.chain.assetId), fee])
      })
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
