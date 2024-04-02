import { NodeId, type ProofOfPossession, type Utxo, Validator } from '../transaction'
import {
  type UtxoFeeData,
  estimatePlatformAddPrimaryValidatorTransaction,
  estimatePlatformAddPrimaryDelegatorTransaction
} from './transaction'
import { type MCNWallet, type VMWallet } from './wallet'
import { StakeError, calculatePrimary, now, verifyTimeRange } from '../utils'
import { type PlatformAPI } from '../api'
import { type StakeConfig } from '../network'
import { type PlatformAccount } from './account'
import { type MCNProvider } from '../juneo'

const BaseShare: number = 100_0000 // 100%
export const ValidationShare: number = 12_0000 // 12%
export const DelegationShare: number = BaseShare - ValidationShare

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
    return (rewards * BigInt(DelegationShare)) / BigInt(BaseShare)
  }

  static verifyStakingValues (
    amount: bigint,
    minStake: bigint,
    maxStake: bigint,
    startTime: bigint,
    endTime: bigint,
    minPeriod: bigint
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

  async estimateValidationFee (
    account: PlatformAccount,
    nodeId: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint,
    pop: ProofOfPossession,
    stakeAddresses: string[],
    stakeThreshold: number,
    rewardAddresses: string[],
    rewardThreshold: number,
    utxoSet: Utxo[]
  ): Promise<UtxoFeeData> {
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    return await estimatePlatformAddPrimaryValidatorTransaction(
      this.provider,
      account,
      validator,
      ValidationShare,
      pop,
      stakeAddresses,
      stakeThreshold,
      rewardAddresses,
      rewardThreshold,
      utxoSet
    )
  }

  async estimateDelegationFee (
    account: PlatformAccount,
    nodeId: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint,
    stakeAddresses: string[],
    stakeThreshold: number,
    rewardAddresses: string[],
    rewardThreshold: number,
    utxoSet: Utxo[]
  ): Promise<UtxoFeeData> {
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    return await estimatePlatformAddPrimaryDelegatorTransaction(
      this.provider,
      account,
      validator,
      stakeAddresses,
      stakeThreshold,
      rewardAddresses,
      rewardThreshold,
      utxoSet
    )
  }

  async validate (amount: bigint, startTime: bigint, endTime: bigint, feeData: UtxoFeeData): Promise<string> {
    StakeManager.verifyValidationValues(amount, startTime, endTime, this.provider.mcn.stakeConfig)
    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(transaction)).txID
  }

  async delegate (amount: bigint, startTime: bigint, endTime: bigint, feeData: UtxoFeeData): Promise<string> {
    StakeManager.verifyDelegationValues(amount, startTime, endTime, this.provider.mcn.stakeConfig)
    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(transaction)).txID
  }
}
