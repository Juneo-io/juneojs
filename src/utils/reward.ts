
const StartRewardYear: bigint = BigInt(1685570400) // 1st June 2023
const DiminishingRewardYear: bigint = BigInt(1811800800)
const TargetRewardYear: bigint = BigInt(1843423200)
const StartReward: bigint = BigInt(21_5000) // 21.5%
const DiminishingRewardTarget: bigint = BigInt(19_5000) // 19.5%
const TargetReward: bigint = BigInt(6_7000) // 6.7%

const MaxPeriodBonusReward: bigint = BigInt(20_000) // 2%
const PercentDenominator: bigint = BigInt(1_000_000)
const MaxStakePeriod: bigint = BigInt(31_536_000)
const ConstantPercentage: bigint = PercentDenominator

// used for non Primary supernet rewards
export function calculate (targetReward: bigint, stakePeriod: bigint, stakeAmount: bigint): bigint {
  const timePercentage: bigint = stakePeriod * PercentDenominator / MaxStakePeriod
  const bonusRewards: bigint = stakePeriod * PercentDenominator / MaxStakePeriod * MaxPeriodBonusReward / PercentDenominator
  return getTimeRewardsValue(targetReward, targetReward, bonusRewards, timePercentage, ConstantPercentage, stakeAmount)
}

export function calculatePrimary (stakePeriod: bigint, currentTime: bigint, stakeAmount: bigint): bigint {
  const timePercentage: bigint = stakePeriod * PercentDenominator / MaxStakePeriod
  const bonusRewards: bigint = stakePeriod * PercentDenominator / MaxStakePeriod * MaxPeriodBonusReward / PercentDenominator
  return getTimeRewards(currentTime, stakeAmount, bonusRewards, timePercentage)
}

function getTimeRewards (currentTime: bigint, stakeAmount: bigint, bonusRewards: bigint, timePercentage: bigint): bigint {
  if (currentTime >= TargetRewardYear) {
    // target period
    return getTimeRewardsValue(TargetReward, TargetReward, bonusRewards, timePercentage, ConstantPercentage, stakeAmount)
  }
  if (currentTime >= DiminishingRewardYear) {
    // diminishing period
    return getTimeRewardsValue(DiminishingRewardTarget, TargetReward, bonusRewards, timePercentage,
      getTimeBoundsPercentage(DiminishingRewardYear, TargetRewardYear, currentTime), stakeAmount)
  }
  if (currentTime >= StartRewardYear) {
    // rewarding period
    return getTimeRewardsValue(StartReward, DiminishingRewardTarget, bonusRewards, timePercentage,
      getTimeBoundsPercentage(StartRewardYear, DiminishingRewardYear, currentTime), stakeAmount)
  }
  // start period or before
  return getTimeRewardsValue(StartReward, StartReward, bonusRewards, timePercentage, ConstantPercentage, stakeAmount)
}

function getTimeRewardsValue (lowerValue: bigint, upperValue: bigint, bonusRewards: bigint,
  timePercentage: bigint, timeBoundsPercentage: bigint, stakeAmount: bigint): bigint {
  let rewardsValue: bigint = upperValue - lowerValue
  rewardsValue *= timeBoundsPercentage
  rewardsValue /= PercentDenominator
  rewardsValue += lowerValue
  rewardsValue += PercentDenominator
  rewardsValue += bonusRewards
  rewardsValue *= stakeAmount
  rewardsValue /= PercentDenominator
  rewardsValue -= stakeAmount
  rewardsValue *= timePercentage
  rewardsValue /= PercentDenominator
  return rewardsValue
}

function getTimeBoundsPercentage (lowerTimeBound: bigint, upperTimeBound: bigint, currentTime: bigint): bigint {
  let periodValue: bigint = currentTime
  const periodValueDenominator: bigint = upperTimeBound - lowerTimeBound
  periodValue -= lowerTimeBound
  periodValue *= PercentDenominator
  periodValue /= periodValueDenominator
  return periodValue
}
