import { NetworkOperationType, ChainNetworkOperation } from './operation'
import { NodeId, type Utxo, Validator } from '../transaction'
import { type UtxoFeeData, estimatePlatformAddValidatorTransaction, estimatePlatformAddDelegatorTransaction } from './transaction'
import { type MCNWallet, type VMWallet } from './wallet'
import { StakeError, calculatePrimary, now, verifyTimeRange } from '../utils'
import { type PlatformAPI } from '../api'
import { type StakeConfig, type MCN } from '../chain'
import { type MCNProvider } from '../juneo'

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

  static from (provider: MCNProvider, wallet: MCNWallet): StakeManager {
    return new StakeManager(provider, wallet.getWallet(provider.platform.chain))
  }

  static estimateValidationReward (stakePeriod: bigint, stakeAmount: bigint): bigint {
    return calculatePrimary(stakePeriod, now(), stakeAmount)
  }

  static estimateDelegationReward (stakePeriod: bigint, stakeAmount: bigint): bigint {
    const rewards: bigint = calculatePrimary(stakePeriod, now(), stakeAmount)
    return rewards * BigInt(DelegationShare) / BigInt(BaseShare)
  }

  static verifyStakingValues (
    amount: bigint, minStake: bigint, maxStake: bigint, startTime: bigint, endTime: bigint, minPeriod: bigint
  ): void {
    if (amount < minStake) {
      throw new StakeError(`amount ${amount} is less than min stake ${minStake}`)
    }
    if (amount > maxStake) {
      throw new StakeError(`amount ${amount} exceeds max stake ${maxStake}`)
    }
    verifyTimeRange(startTime, endTime, minPeriod)
  }

  static verifyValidationValues (amount: bigint, startTime: bigint, endTime: bigint, config: StakeConfig): void {
    const minStake: bigint = config.minValidatorStake
    const maxStake: bigint = config.maxValidatorStake
    const minPeriod: bigint = config.minStakeDuration
    StakeManager.verifyStakingValues(amount, minStake, maxStake, startTime, endTime, minPeriod)
  }

  static verifyDelegationValues (amount: bigint, startTime: bigint, endTime: bigint, config: StakeConfig): void {
    const minStake: bigint = config.minDelegatorStake
    // this is not a correct max value but can be used for a sanity pre-check
    const maxStake: bigint = config.maxValidatorStake
    const minPeriod: bigint = config.minStakeDuration
    StakeManager.verifyStakingValues(amount, minStake, maxStake, startTime, endTime, minPeriod)
  }

  async estimateValidationFee (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    return await estimatePlatformAddValidatorTransaction(this.provider, this.wallet, validator, ValidationShare, utxoSet)
  }

  async estimateDelegationFee (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    return await estimatePlatformAddDelegatorTransaction(this.provider, this.wallet, validator, utxoSet)
  }

  async validate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, feeData?: UtxoFeeData, utxoSet?: Utxo[]): Promise<string> {
    StakeManager.verifyValidationValues(amount, startTime, endTime, this.provider.mcn.stakeConfig)
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee(nodeId, amount, startTime, endTime, utxoSet)
    }
    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(transaction)).txID
  }

  async delegate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, feeData?: UtxoFeeData, utxoSet?: Utxo[]): Promise<string> {
    StakeManager.verifyDelegationValues(amount, startTime, endTime, this.provider.mcn.stakeConfig)
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee(nodeId, amount, startTime, endTime, utxoSet)
    }
    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(transaction)).txID
  }
}

export abstract class Staking extends ChainNetworkOperation {
  nodeId: string
  amount: bigint
  startTime: bigint
  endTime: bigint

  constructor (type: NetworkOperationType, mcn: MCN, nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(type, mcn.primary.platform)
    this.nodeId = nodeId
    this.amount = amount
    this.startTime = startTime
    this.endTime = endTime
  }
}

export class ValidateOperation extends Staking {
  constructor (mcn: MCN, nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(NetworkOperationType.Validate, mcn, nodeId, amount, startTime, endTime)
  }
}

export class DelegateOperation extends Staking {
  constructor (mcn: MCN, nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(NetworkOperationType.Delegate, mcn, nodeId, amount, startTime, endTime)
  }
}
