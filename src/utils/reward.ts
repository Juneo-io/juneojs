import { type RewardConfig } from '../chain'

const PrecisionConstant: bigint = BigInt(1_000_000)

export class RewardCalculator {
  config: RewardConfig

  constructor (config: RewardConfig) {
    this.config = config
  }

  // Used for non Primary supernet rewards
  calculate (stakePeriod: bigint, currentTime: bigint, stakeAmount: bigint): bigint {
    const boundsPercentage: bigint = this.getRemainingTimeBoundsPercentage(
      this.config.startRewardTime,
      this.config.targetRewardTime,
      currentTime
    )
    const reward: bigint = this.getReward(this.config.targetReward, this.config.startReward, boundsPercentage)
    return this.getEffectiveReward(stakePeriod, stakeAmount, reward)
  }

  calculatePrimary (stakePeriod: bigint, currentTime: bigint, stakeAmount: bigint): bigint {
    const reward: bigint = this.getCurrentPrimaryReward(currentTime)
    return this.getEffectiveReward(stakePeriod, stakeAmount, reward)
  }

  getEffectiveReward (stakePeriod: bigint, stakeAmount: bigint, reward: bigint): bigint {
    reward += this.getStakePeriodReward(
      this.config.maxStakePeriod,
      this.config.minStakePeriod,
      stakePeriod,
      this.config.stakePeriodRewardShare
    )
    const stakePeriodRatio: bigint = (stakePeriod * PrecisionConstant) / this.config.maxStakePeriod
    const effectiveReward: bigint = (reward * stakePeriodRatio) / PrecisionConstant
    return (stakeAmount * effectiveReward) / PrecisionConstant
  }

  getStakePeriodReward (
    maxStakePeriod: bigint,
    minStakePeriod: bigint,
    stakePeriod: bigint,
    stakePeriodRewardShare: bigint
  ): bigint {
    const adjustedStakePeriod: bigint = (stakePeriod - minStakePeriod) * PrecisionConstant
    const adjustedMaxStakePeriod: bigint = maxStakePeriod - minStakePeriod
    const adjustedStakePeriodRatio: bigint = adjustedStakePeriod / adjustedMaxStakePeriod
    return (adjustedStakePeriodRatio * stakePeriodRewardShare) / PrecisionConstant
  }

  getCurrentPrimaryReward (currentTime: bigint): bigint {
    if (currentTime >= this.config.targetRewardTime) {
      return this.config.targetReward
    }
    if (currentTime >= this.config.diminishingRewardTime) {
      return this.getReward(
        this.config.targetReward,
        this.config.diminishingReward,
        this.getRemainingTimeBoundsPercentage(
          this.config.diminishingRewardTime,
          this.config.targetRewardTime,
          currentTime
        )
      )
    }
    if (currentTime >= this.config.startRewardTime) {
      return this.getReward(
        this.config.diminishingReward,
        this.config.startReward,
        this.getRemainingTimeBoundsPercentage(
          this.config.startRewardTime,
          this.config.diminishingRewardTime,
          currentTime
        )
      )
    }
    // Start period or before
    return this.config.startReward
  }

  getReward (lowerReward: bigint, upperReward: bigint, remainingTimeBoundsPercentage: bigint): bigint {
    const diminishingReward: bigint = upperReward - lowerReward
    const remainingReward: bigint = (diminishingReward * remainingTimeBoundsPercentage) / PrecisionConstant
    return remainingReward + lowerReward
  }

  /**
   * Get the remaining percentage of time between two bounds with the current time.
   * @param lowerTimeBound The lowest time value of the bounds. Must be lower than upper bound.
   * @param upperTimeBound The highest time value of the bounds. Must be higher than lower bound.
   * @param currentTime The current time value.
   * @returns The remaining percentage between lower and upper bounds calculated against current time.
   * Returned value is [PrecisionConstant, 0]. If currentTime is out of upper bound then
   * 0 is returned. If currentTime is out of lower bound then PrecisionConstant (100%) is returned.
   */
  getRemainingTimeBoundsPercentage (lowerTimeBound: bigint, upperTimeBound: bigint, currentTime: bigint): bigint {
    // Current time is before or at lower bound
    if (currentTime <= lowerTimeBound) {
      return PrecisionConstant
    }
    const maxElapsedTime: bigint = upperTimeBound - lowerTimeBound
    const elapsedTime: bigint = currentTime - lowerTimeBound
    // Current time is after or at upper bound
    if (elapsedTime >= maxElapsedTime) {
      return BigInt(0)
    }
    return PrecisionConstant - (elapsedTime * PrecisionConstant) / maxElapsedTime
  }
}
