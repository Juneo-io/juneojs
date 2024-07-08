import { type JNTAsset, type TokenAsset } from '../asset'
import { type MCNProvider } from '../juneo'
import { fetchJNT, RewardCalculator, TimeUtils, validateBech32 } from '../utils'
import { AbstractBlockchain } from './chain'
import { BaseShare, JVM_HD_PATH, PLATFORMVM_ID } from './constants'
import { ChainVM, VMType, VMWalletType } from './vm'

export class PlatformBlockchain extends AbstractBlockchain {
  stakeConfig: StakeConfig
  rewardConfig: RewardConfig
  rewardCalculator: RewardCalculator

  constructor (
    name: string,
    id: string,
    asset: JNTAsset,
    stakeConfig: StakeConfig,
    rewardConfig: RewardConfig,
    aliases?: string[],
    registeredAssets: TokenAsset[] = []
  ) {
    super(
      name,
      id,
      new ChainVM(PLATFORMVM_ID, VMType.JVM, VMWalletType.Utxo, JVM_HD_PATH),
      asset,
      aliases,
      registeredAssets
    )
    this.stakeConfig = stakeConfig
    this.rewardConfig = rewardConfig
    this.rewardCalculator = new RewardCalculator(rewardConfig)
  }

  protected async fetchAsset (provider: MCNProvider, assetId: string): Promise<TokenAsset> {
    return await fetchJNT(provider, assetId)
  }

  validateAddress (address: string, hrp?: string): boolean {
    return validateBech32(address, hrp, this.aliases.concat(this.id))
  }

  estimatePrimaryValidationReward (stakePeriod: bigint, stakeAmount: bigint): bigint {
    return this.rewardCalculator.calculate(stakePeriod, TimeUtils.now(), stakeAmount)
  }

  estimatePrimaryDelegationReward (stakePeriod: bigint, stakeAmount: bigint): bigint {
    const rewards = this.rewardCalculator.calculate(stakePeriod, TimeUtils.now(), stakeAmount)
    return (rewards * BigInt(BaseShare - this.stakeConfig.minDelegationFee)) / BigInt(BaseShare)
  }
}

export class StakeConfig {
  uptimeRequirement: number
  minValidatorStake: bigint
  maxValidatorStake: bigint
  minDelegatorStake: bigint
  minDelegationFee: number
  maxDelegationFee: number
  minStakeDuration: bigint
  maxStakeDuration: bigint

  constructor (
    uptimeRequirement: number,
    minValidatorStake: bigint,
    maxValidatorStake: bigint,
    minDelegatorStake: bigint,
    minDelegationFee: number,
    maxDelegationFee: number,
    minStakeDuration: bigint,
    maxStakeDuration: bigint
  ) {
    this.uptimeRequirement = uptimeRequirement
    this.minValidatorStake = minValidatorStake
    this.maxValidatorStake = maxValidatorStake
    this.minDelegatorStake = minDelegatorStake
    this.minDelegationFee = minDelegationFee
    this.maxDelegationFee = maxDelegationFee
    this.minStakeDuration = minStakeDuration
    this.maxStakeDuration = maxStakeDuration
  }
}

export class RewardConfig {
  minStakePeriod: bigint
  maxStakePeriod: bigint
  stakePeriodRewardShare: bigint
  startRewardTime: bigint
  startRewardShare: bigint
  diminishingRewardTime: bigint
  diminishingRewardShare: bigint
  targetRewardTime: bigint
  targetRewardShare: bigint

  constructor (
    minStakePeriod: bigint,
    maxStakePeriod: bigint,
    stakePeriodRewardShare: bigint,
    startRewardTime: bigint,
    startRewardShare: bigint,
    diminishingRewardTime: bigint,
    diminishingRewardShare: bigint,
    targetRewardTime: bigint,
    targetRewardShare: bigint
  ) {
    this.minStakePeriod = minStakePeriod
    this.maxStakePeriod = maxStakePeriod
    this.stakePeriodRewardShare = stakePeriodRewardShare
    this.startRewardTime = startRewardTime
    this.startRewardShare = startRewardShare
    this.diminishingRewardTime = diminishingRewardTime
    this.diminishingRewardShare = diminishingRewardShare
    this.targetRewardTime = targetRewardTime
    this.targetRewardShare = targetRewardShare
  }
}
