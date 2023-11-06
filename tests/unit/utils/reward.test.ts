import { calculate, calculatePrimary } from '../../../src'

describe('Reward Calculation Tests', () => {
  const DiminishingRewardYear: bigint = BigInt(1811800800)
  const TargetRewardYear: bigint = BigInt(1843423200)

  const MinStakePeriod: bigint = BigInt(86_400)
  const MaxStakePeriod: bigint = BigInt(31_536_000)

  describe('calculate function', () => {
    test.each([
      // [description, targetReward, stakePeriod, stakeAmount, expectedResult]
      ['Start of start reward year', BigInt(21_5000), BigInt(1685570400), BigInt(1_000_000), BigInt(68781651n)],
      ['End of start reward year', BigInt(21_5000), BigInt(1811790800), BigInt(1_000_000), BigInt(78543738n)],
      ['Start of diminishing reward year', BigInt(19_5000), BigInt(1811800800), BigInt(1_000_000), BigInt(77395537n)],
      ['End of diminishing reward year', BigInt(19_5000), BigInt(1843423199), BigInt(1_000_000), BigInt(79921888n)],
      ['Start of target reward year', BigInt(6_7000), BigInt(1843423200), BigInt(1_000_000), BigInt(72439704n)],
      [
        'Middle of target reward year',
        BigInt(6_7000),
        BigInt((DiminishingRewardYear + TargetRewardYear) / BigInt(2)),
        BigInt(1_000_000),
        BigInt(71235662n),
      ],
      ['Just after start reward year begins', BigInt(21_5000), BigInt(1685570500), BigInt(500_000), BigInt(34390827n)],
      [
        'Just before diminishing reward year begins',
        BigInt(21_5000),
        BigInt(1811800700),
        BigInt(2_000_000),
        BigInt(157089140n),
      ],
      [
        'Just after diminishing reward year begins',
        BigInt(19_5000),
        BigInt(1811800900),
        BigInt(500_000),
        BigInt(38697771n),
      ],
      [
        'Middle of diminishing reward year',
        BigInt(19_5000),
        BigInt((DiminishingRewardYear + TargetRewardYear) / BigInt(2)),
        BigInt(3_000_000),
        BigInt(235961013n),
      ],
      [
        'Just before target reward year begins',
        BigInt(19_5000),
        BigInt(1843423100),
        BigInt(1_000_000),
        BigInt(79921884n),
      ],
      [
        'Just after target reward year begins',
        BigInt(6_7000),
        BigInt(1843423300),
        BigInt(2_000_000),
        BigInt(144879414n),
      ],
      [
        'Long stake period with start reward',
        BigInt(21_5000),
        BigInt(2n * MinStakePeriod),
        BigInt(1_000_000),
        BigInt(1178n),
      ],
      [
        'Short stake period with diminishing reward',
        BigInt(19_5000),
        MinStakePeriod + BigInt(1),
        BigInt(1_000_000),
        BigInt(534n),
      ],
      [
        'Maximum stake period just before target reward year',
        BigInt(19_5000),
        MaxStakePeriod - BigInt(1),
        BigInt(500_000),
        BigInt(107499n),
      ],
      [
        'Minimum stake period just after target reward year',
        BigInt(6_7000),
        MinStakePeriod + BigInt(1),
        BigInt(1_000_000),
        BigInt(183n),
      ],
      ['Stake period is zero', BigInt(21_5000), BigInt(0), BigInt(1_000_000), BigInt(0n)],
      ['Stake period is below minimum', BigInt(21_5000), MinStakePeriod - BigInt(1), BigInt(1_000_000), BigInt(0n)],
      ['Stake amount is zero', BigInt(21_5000), BigInt(86_400), BigInt(0), BigInt(0n)],
      ['Stake amount is below minimum', BigInt(21_5000), BigInt(86_400), BigInt(1), BigInt(0n)],
      ['Target reward is zero', BigInt(0), BigInt(86_400), BigInt(1_000_000), BigInt(0n)],
      ['Target reward is negative', BigInt(-1), BigInt(86_400), BigInt(1_000_000), BigInt(0n)],
      ['Stake period is too long', BigInt(21_5000), MaxStakePeriod + BigInt(1), BigInt(1_000_000), BigInt(0n)],
    ])('%s', (_, targetReward, stakePeriod, stakeAmount, expectedResult) => {
      const result = calculate(targetReward, stakePeriod, stakeAmount)
      expect(result).toBe(expectedResult)
    })
  })

  describe('calculatePrimary function', () => {
    test.each([
      // [description, targetReward, stakePeriod, stakeAmount, expectedResult]
      ['Start of start reward year', BigInt(21_5000), BigInt(1685570400), BigInt(1_000_000), BigInt(1466n)],
      ['End of start reward year', BigInt(21_5000), BigInt(1811790800), BigInt(1_000_000), BigInt(1329n)],
      ['Start of diminishing reward year', BigInt(19_5000), BigInt(1811800800), BigInt(1_000_000), BigInt(1206n)],
      ['End of diminishing reward year', BigInt(19_5000), BigInt(1843423199), BigInt(1_000_000), BigInt(414n)],
      ['Start of target reward year', BigInt(6_7000), BigInt(1843423200), BigInt(1_000_000), BigInt(142n)],
      [
        'Middle of target reward year',
        BigInt(6_7000),
        BigInt((DiminishingRewardYear + TargetRewardYear) / BigInt(2)),
        BigInt(1_000_000),
        BigInt(278n),
      ],
      ['Just after start reward year begins', BigInt(21_5000), BigInt(1685570500), BigInt(500_000), BigInt(733n)],
      [
        'Just before diminishing reward year begins',
        BigInt(21_5000),
        BigInt(1811800700),
        BigInt(2_000_000),
        BigInt(2658n),
      ],
      ['Just after diminishing reward year begins', BigInt(19_5000), BigInt(1811800900), BigInt(500_000), BigInt(603n)],
      [
        'Middle of diminishing reward year',
        BigInt(19_5000),
        BigInt((DiminishingRewardYear + TargetRewardYear) / BigInt(2)),
        BigInt(3_000_000),
        BigInt(2430n),
      ],
      ['Just before target reward year begins', BigInt(19_5000), BigInt(1843423100), BigInt(1_000_000), BigInt(414n)],
      ['Just after target reward year begins', BigInt(6_7000), BigInt(1843423300), BigInt(2_000_000), BigInt(284n)],
      [
        'Long stake period with start reward',
        BigInt(21_5000),
        BigInt(2n * MinStakePeriod),
        BigInt(1_000_000),
        BigInt(1466n),
      ],
      [
        'Short stake period with diminishing reward',
        BigInt(19_5000),
        MinStakePeriod + BigInt(1),
        BigInt(1_000_000),
        BigInt(1329n),
      ],
      [
        'Maximum stake period just before target reward year',
        BigInt(19_5000),
        MaxStakePeriod - BigInt(1),
        BigInt(500_000),
        BigInt(664n),
      ],
      [
        'Minimum stake period just after target reward year',
        BigInt(6_7000),
        MinStakePeriod + BigInt(1),
        BigInt(1_000_000),
        BigInt(456n),
      ],
      ['Stake period is zero', BigInt(21_5000), BigInt(0), BigInt(1_000_000), BigInt(0n)],
      ['Stake period is below minimum', BigInt(21_5000), MinStakePeriod - BigInt(1), BigInt(1_000_000), BigInt(0n)],
      ['Stake amount is zero', BigInt(21_5000), BigInt(86_400), BigInt(0), BigInt(0n)],
      ['Stake amount is below minimum', BigInt(21_5000), BigInt(86_400), BigInt(1), BigInt(0n)],
      ['Target reward is zero', BigInt(0), BigInt(86_400), BigInt(1_000_000), BigInt(0n)],
      ['Target reward is negative', BigInt(-1), BigInt(86_400), BigInt(1_000_000), BigInt(0n)],
      ['Stake period is too long', BigInt(21_5000), MaxStakePeriod + BigInt(1), BigInt(1_000_000), BigInt(0n)],
    ])('%s', (_, targetReward, stakePeriod, stakeAmount, expectedResult) => {
      const result = calculatePrimary(targetReward, stakePeriod, stakeAmount)
      expect(result).toBe(expectedResult)
    })
  })
})
