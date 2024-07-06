import { type RewardConfig } from '../chain'

const PrecisionConstant: bigint = BigInt(1_000_000)

export class RewardCalculator {
  config: RewardConfig

  constructor (config: RewardConfig) {
    this.config = config
  }

  calculate (stakePeriod: bigint, currentTime: bigint, stakeAmount: bigint): bigint {
    let reward = this.getCurrentReward(currentTime)
    reward += this.getStakePeriodReward(stakePeriod)
    const stakePeriodRatio = (stakePeriod * PrecisionConstant) / this.config.maxStakePeriod
    const effectiveReward = (reward * stakePeriodRatio) / PrecisionConstant
    return (stakeAmount * effectiveReward) / PrecisionConstant
  }

  getStakePeriodReward (stakePeriod: bigint): bigint {
    const adjustedStakePeriod = (stakePeriod - this.config.minStakePeriod) * PrecisionConstant
    const adjustedMaxStakePeriod = this.config.maxStakePeriod - this.config.minStakePeriod
    const adjustedStakePeriodRatio = adjustedStakePeriod / adjustedMaxStakePeriod
    return (adjustedStakePeriodRatio * this.config.stakePeriodRewardShare) / PrecisionConstant
  }

  getCurrentReward (currentTime: bigint): bigint {
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
    const diminishingReward = upperReward - lowerReward
    const remainingReward = (diminishingReward * remainingTimeBoundsPercentage) / PrecisionConstant
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
    const maxElapsedTime = upperTimeBound - lowerTimeBound
    const elapsedTime = currentTime - lowerTimeBound
    // Current time is after or at upper bound
    if (elapsedTime >= maxElapsedTime) {
      return BigInt(0)
    }
    return PrecisionConstant - (elapsedTime * PrecisionConstant) / maxElapsedTime
  }
}
