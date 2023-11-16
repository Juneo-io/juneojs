const StartRewardYear: bigint = BigInt(1685570400) // 1st June 2023
const DiminishingRewardYear: bigint = BigInt(1811800800)
const TargetRewardYear: bigint = BigInt(1843423200)
const StartReward: bigint = BigInt(21_5000) // 21.5%
const DiminishingRewardTarget: bigint = BigInt(19_5000) // 19.5%
const TargetReward: bigint = BigInt(6_7000) // 6.7%

const StakePeriodRewardShare: bigint = BigInt(2_0000) // 2%
const PrecisionConstant: bigint = BigInt(1_000_000)
const MinStakePeriod: bigint = BigInt(86_400)
const MaxStakePeriod: bigint = BigInt(31_536_000)

// TODO Add and use reward config values

// Used for non Primary supernet rewards
export function calculate (stakePeriod: bigint, currentTime: bigint, stakeAmount: bigint): bigint {
  const boundsPercentage: bigint = getRemainingTimeBoundsPercentage(StartRewardYear, TargetRewardYear, currentTime)
  const reward: bigint = getReward(TargetReward, StartReward, boundsPercentage)
  return getEffectiveReward(stakePeriod, stakeAmount, reward)
}

export function calculatePrimary (stakePeriod: bigint, currentTime: bigint, stakeAmount: bigint): bigint {
  const reward: bigint = getCurrentPrimaryReward(currentTime)
  return getEffectiveReward(stakePeriod, stakeAmount, reward)
}

function getEffectiveReward (stakePeriod: bigint, stakeAmount: bigint, reward: bigint): bigint {
  reward += getStakePeriodReward(stakePeriod)
  const stakePeriodRatio: bigint = (stakePeriod * PrecisionConstant) / MaxStakePeriod
  const effectiveReward: bigint = (reward * stakePeriodRatio) / PrecisionConstant
  return (stakeAmount * effectiveReward) / PrecisionConstant
}

function getStakePeriodReward (stakePeriod: bigint): bigint {
  const adjustedStakePeriod: bigint = (stakePeriod - MinStakePeriod) * PrecisionConstant
  const adjustedMaxStakePeriod: bigint = MaxStakePeriod - MinStakePeriod
  const adjustedStakePeriodRatio: bigint = adjustedStakePeriod / adjustedMaxStakePeriod
  return (adjustedStakePeriodRatio * StakePeriodRewardShare) / PrecisionConstant
}

function getCurrentPrimaryReward (currentTime: bigint): bigint {
  if (currentTime >= TargetRewardYear) {
    return TargetReward
  }
  if (currentTime >= DiminishingRewardYear) {
    return getReward(
      TargetReward,
      DiminishingRewardTarget,
      getRemainingTimeBoundsPercentage(DiminishingRewardYear, TargetRewardYear, currentTime)
    )
  }
  if (currentTime >= StartRewardYear) {
    return getReward(
      DiminishingRewardTarget,
      StartReward,
      getRemainingTimeBoundsPercentage(StartRewardYear, DiminishingRewardYear, currentTime)
    )
  }
  // Start period or before
  return StartReward
}

function getReward (lowerReward: bigint, upperReward: bigint, remainingTimeBoundsPercentage: bigint): bigint {
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
function getRemainingTimeBoundsPercentage (lowerTimeBound: bigint, upperTimeBound: bigint, currentTime: bigint): bigint {
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
