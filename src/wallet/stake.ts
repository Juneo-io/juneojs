import { type GetCurrentValidatorsResponse, type PlatformAPI } from '../api'
import { type PlatformBlockchain } from '../chain'
import { type MCNProvider } from '../juneo'
import { NodeId, Validator, type Utxo } from '../transaction'
import { WalletError, calculatePrimary, now } from '../utils'
import { MCNOperationSummary, MCNOperationType, type MCNOperation } from './operation'
import { estimatePlatformAddDelegatorTransaction, estimatePlatformAddValidatorTransaction, type Spending, type UtxoFeeData } from './transaction'
import { type JuneoWallet, type VMWallet } from './wallet'

export const ValidationShare: number = 12_0000 // 12%
const BaseShare: number = 100_0000 // 100%
const DelegationShare: number = BaseShare - ValidationShare

export class StakeManager {
  private readonly provider: MCNProvider
  private readonly api: PlatformAPI
  private readonly wallet: VMWallet

  constructor (provider: MCNProvider, wallet: VMWallet) {
    this.provider = provider
    this.api = provider.platform
    this.wallet = wallet
  }

  static from (provider: MCNProvider, wallet: JuneoWallet): StakeManager {
    return new StakeManager(provider, wallet.getWallet(provider.platform.chain))
  }

  static estimateValidationReward (stakePeriod: bigint, stakeAmount: bigint): bigint {
    return calculatePrimary(stakePeriod, now(), stakeAmount)
  }

  static estimateDelegationReward (stakePeriod: bigint, stakeAmount: bigint): bigint {
    const rewards: bigint = calculatePrimary(stakePeriod, now(), stakeAmount)
    return rewards * BigInt(DelegationShare) / BigInt(BaseShare)
  }

  async estimateValidationFee (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    return await estimatePlatformAddValidatorTransaction(this.provider, this.wallet, validator, ValidationShare, utxoSet)
  }

  async estimateDelegationFee (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    return await estimatePlatformAddDelegatorTransaction(this.provider, this.wallet, validator, utxoSet)
  }

  private checkTimeValidity (startTime: bigint, endTime: bigint): void {
    if (startTime < now()) {
      throw new WalletError('Stake start time must be in the future')
    }
    if (endTime <= startTime) {
      throw new WalletError('Stake end time must be after start time')
    }
  }

  private checkNodeId (nodeId: string, mustBeValidator: boolean, nodeIdData: GetCurrentValidatorsResponse): void {
    if (mustBeValidator && nodeIdData.validators.length <= 0) {
      throw new WalletError(`Node ${nodeId} is not a validator`)
    }
    if (!mustBeValidator && nodeIdData.validators.length > 0) {
      throw new WalletError(`Attempted to issue duplicate validation for node ${nodeId}`)
    }
  }

  private checkStakeAmount (amount: bigint, minStake: bigint, maxStake: bigint): void {
    if (amount > maxStake) {
      throw new WalletError(`Stake amount ${amount} exceeds max stake ${maxStake}`)
    }
    if (amount < minStake) {
      throw new WalletError(`Stake amount ${amount} is less than min stake ${minStake}`)
    }
  }

  async validate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, feeData?: UtxoFeeData, utxoSet?: Utxo[]): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee(nodeId, amount, startTime, endTime, utxoSet)
    }
    const nodeIdData = await this.api.getCurrentValidators(undefined, [nodeId])

    // check if the time is valid
    this.checkTimeValidity(startTime, endTime)
    if (endTime - startTime < this.provider.mcn.stakeConfig.minStakeDuration) {
      throw new WalletError(`Stake duration must be at least ${this.provider.mcn.stakeConfig.minStakeDuration} seconds`)
    }

    // check if node already validate (must be false)
    this.checkNodeId(nodeId, false, nodeIdData)

    // check if stake amount is valid
    // ici j'ai l'impression que le check du amount se fait directement dans estimateValidationFee
    this.checkStakeAmount(amount, BigInt(this.provider.mcn.stakeConfig.minValidatorStake), BigInt(this.provider.mcn.stakeConfig.maxValidatorStake))

    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(transaction)).txID
  }

  async delegate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, feeData?: UtxoFeeData, utxoSet?: Utxo[]): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee(nodeId, amount, startTime, endTime, utxoSet)
    }

    const nodeIdData = await this.api.getCurrentValidators(undefined, [nodeId])
    // check if node already validate (must be true)
    this.checkTimeValidity(startTime, endTime)

    // check if the time is valid
    this.checkNodeId(nodeId, true, nodeIdData)
    if (endTime > BigInt(nodeIdData.validators[0].endTime)) {
      throw new WalletError(`Stake duration must be less than ${nodeIdData.validators[0].endTime} seconds`)
    }

    // check if stake amount is valid
    // available = (maxValidatorStake * 5) - delegatorWeight - stakeAmount
    const available = (BigInt(nodeIdData.validators[0].stakeAmount) * BigInt(5)) -
     BigInt(nodeIdData.validators[0].delegatorWeight) -
     BigInt(nodeIdData.validators[0].stakeAmount)
    this.checkStakeAmount(amount, BigInt(this.provider.mcn.stakeConfig.minDelegatorStake), available)

    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(transaction)).txID
  }
}

abstract class Staking implements MCNOperation {
  type: MCNOperationType
  nodeId: string
  amount: bigint
  startTime: bigint
  endTime: bigint

  constructor (type: MCNOperationType, nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    this.type = type
    this.nodeId = nodeId
    this.amount = amount
    this.startTime = startTime
    this.endTime = endTime
  }
}

export class ValidateOperation extends Staking {
  constructor (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(MCNOperationType.Validate, nodeId, amount, startTime, endTime)
  }
}

export class DelegateOperation extends Staking {
  constructor (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(MCNOperationType.Delegate, nodeId, amount, startTime, endTime)
  }
}

export class StakingOperationSummary extends MCNOperationSummary {
  potentialReward: bigint

  constructor (operation: Staking, chain: PlatformBlockchain, fees: UtxoFeeData[], spendings: Spending[], potentialReward: bigint) {
    super(operation, [chain], fees, spendings)
    this.potentialReward = potentialReward
  }
}
