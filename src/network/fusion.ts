import { JEVMGasToken, JNTAsset, JRC20Asset, WrappedAsset } from '../asset'
import { JEVMBlockchain, JVMBlockchain, PlatformBlockchain, RewardConfig, StakeConfig } from '../chain'
import { MCN, PrimarySupernet } from './network'

const FusionNetworkName = 'Fusion1 Supernet'
const FusionNetworkId = 49
const FusionHrp = 'fusion'
const FusionStakeConfig = new StakeConfig(
  0.8, // 80%
  BigInt(20_000000000), // 20 BANANA1
  BigInt(30_000_000000000), // 30_000 BANANA1
  BigInt(1_000000), // 0.1 BANANA1
  5_0000, // 5%
  5_0000, // 5%
  BigInt(14 * 86_400), // 14 days
  BigInt(365 * 86_400) // 365 days
)
const FusionRewardConfig = new RewardConfig(
  BigInt(1_209_600), // 14 day
  BigInt(31_536_000), // 365 days
  BigInt(2_0000), // 2%
  BigInt(1749945600), // 15th June 2025
  BigInt(19_5000), // 19.5%
  BigInt(1907712000), // 15th June  2030
  BigInt(19_5000), // 19.5%
  BigInt(1939248000), // 15th June  2031
  BigInt(6_6000) // 6.6%
)
const FusionAddress = 'https://rpc.fusion1-mainnet.network'

export const FusionFUSION1AssetId = 'c8yjve1m1jsCN9bHcbx12eiwuc8V8RvdxX7D8Vp94U7BfyYhS'
export const FusionSANTOS1AssetId = 'G4UEgSDc1KRVZyN5o3Ck1yf2tWHSKgcoQdrJ39YNcPaMSMM2G'
export const FusionPSG1AssetId = '2giVcsEctNrt2qJ9Fq9eY692DEjFw6dUG9kncSj6vUTsNgdjX1'
export const FusionJUV1AssetId = 'atGZ6KYieKtW35xcHaC2LipJFjPSRKLV1uAboqUJNGB8PQHax'
export const FusionGAL1AssetId = '2nwY3DtNjFbE98SpxK26E4ZtGNrAvVh4u5nBimXbWeW5MgfTvp'
export const FusionOG1AssetId = 'BnFBHsz1zgerrHY1rhx1j94xkEwXEwpsgyreXXE67FZmTLqcY'
export const FusionFORM1AssetId = '2hokCBn3jmsdMh8yg8pP4y49RDB5scLupCEAfA8h6bh2HJt6aL'
export const FusionSAND1AssetId = '2RWZ5JSYceyNfuABw7bp2K5M5rRq23DFMpT24peTZFMaAvufVw'
export const FusionBRL1AssetId = '2anSgB4z74Nuk1vPPJhKK95pfXcXE8pbKEhMSouw2ofmRZeyNo'
export const FusionAED1AssetId = 'SMUQcbVsYqoTBdvfWjCTxVjCoN4ZUs7qwrMB3zqetTsaBZtdq'
export const FusionVUSD1AssetId = 'kabW1a6uzUKi277PNLbgisKZkv6rTF5SkFEgXfABx39J5tKH2'
export const FusionMXN1AssetId = 'HjdiZpXajP9EPmA2JS9o2qxMPtAg9HRg8ef8aU8LVEC9qJhGT'

export const FusionFUSION1Asset = new JNTAsset(FusionFUSION1AssetId, 'FUSION1', 'FUS', 9, false)
export const FusionSANTOS1Asset = new JNTAsset(FusionSANTOS1AssetId, 'Santos FC', 'SANTOS1', 9, false)
export const FusionPSG1Asset = new JNTAsset(FusionPSG1AssetId, 'Paris Saint-Germain', 'PSG1', 9, false)
export const FusionJUV1Asset = new JNTAsset(FusionJUV1AssetId, 'Juventus', 'JUV1', 9, false)
export const FusionGAL1Asset = new JNTAsset(FusionGAL1AssetId, 'Galatasary', 'GAL1', 9, false)
export const FusionOG1Asset = new JNTAsset(FusionOG1AssetId, 'OG Fan', 'OG1', 9, false)
export const FusionFORM1Asset = new JNTAsset(FusionFORM1AssetId, 'Four', 'FORM1', 9, false)
export const FusionSAND1Asset = new JNTAsset(FusionSAND1AssetId, 'The Sandbox', 'SAND1', 9, false)
export const FusionBRL1Asset = new JNTAsset(FusionBRL1AssetId, 'Brazilian Real Token', 'BRL1', 9, false)
export const FusionAED1Asset = new JNTAsset(FusionAED1AssetId, 'United Arab Emirate Dirham Token', 'AED1', 9, false)
export const FusionVUSD1Asset = new JNTAsset(FusionVUSD1AssetId, 'Vaulted USD', 'vUSD1', 9, false)
export const FusionMXN1Asset = new JNTAsset(FusionMXN1AssetId, 'Mexican Peso Token', 'MXN1', 9, false)
// FUSION1 is omitted here because it should be registered by default as the chain asset
const jntAssets: JNTAsset[] = [
  FusionSANTOS1Asset,
  FusionPSG1Asset,
  FusionJUV1Asset,
  FusionGAL1Asset,
  FusionOG1Asset,
  FusionFORM1Asset,
  FusionSAND1Asset,
  FusionBRL1Asset,
  FusionAED1Asset,
  FusionVUSD1Asset,
  FusionMXN1Asset
]

export const FusionPlatformChain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  FusionFUSION1Asset,
  FusionStakeConfig,
  FusionRewardConfig,
  ['P'],
  jntAssets
)
export const FusionJVMChain = new JVMBlockchain(
  'JVM-Chain',
  '2ip3bvABP5NPpWwS6C46ASy69vRFiJ9w6U6d6ytmv9cPS9nvH',
  FusionFUSION1Asset,
  ['JVM'],
  jntAssets
)
const jrc20Assets: JRC20Asset[] = [
  new JRC20Asset('0x2d00000000000000000000000000000000000000', 'Santos FC', 'SANTOS', 9, FusionSANTOS1AssetId),
  new JRC20Asset('0x2e00000000000000000000000000000000000000', 'Paris Saint-Germain', 'PSG', 9, FusionPSG1AssetId),
  new JRC20Asset('0x2f00000000000000000000000000000000000000', 'Juventus', 'JUV', 9, FusionJUV1AssetId),
  new JRC20Asset('0x3000000000000000000000000000000000000000', 'Galatasary', 'GAL', 9, FusionGAL1AssetId),
  new JRC20Asset('0x3100000000000000000000000000000000000000', 'OG Fan', 'OG', 9, FusionOG1AssetId),
  new JRC20Asset('0x3200000000000000000000000000000000000000', 'Four', 'FORM', 9, FusionFORM1AssetId),
  new JRC20Asset('0x3300000000000000000000000000000000000000', 'The Sandbox', 'SAND', 9, FusionSAND1AssetId),
  new JRC20Asset('0x3400000000000000000000000000000000000000', 'Brazilian Real Token', 'BRL', 9, FusionBRL1AssetId),
  new JRC20Asset(
    '0x3500000000000000000000000000000000000000',
    'United Arab Emirate Dirham Token',
    'AED',
    9,
    FusionAED1AssetId
  ),
  new JRC20Asset('0x3600000000000000000000000000000000000000', 'Vaulted USD', 'vUSD', 9, FusionVUSD1AssetId),
  new JRC20Asset('0x3700000000000000000000000000000000000000', 'Mexican Peso Token', 'MXN', 9, FusionMXN1AssetId)
]
export const FusionWFUSION1Asset = new WrappedAsset(
  '0x466e8b1156e49D29B70447a9Af68038cF5562BdD',
  'Wrapped FUSION1',
  'wFUS',
  18
)
export const FusionFUSION1Chain = new JEVMBlockchain(
  'FUSION1-Chain',
  '2EciyikxKRzUiQm22o71cbYaNMQamvcB5FxthdzXPZmUExsQno',
  new JEVMGasToken(FusionFUSION1Asset),
  BigInt(95003),
  BigInt('2000000000'),
  FusionAddress,
  ['FUSION1'],
  jrc20Assets,
  jrc20Assets
  // FusionWFUSION1Asset,
)
export const FusionSANTOS1Chain = new JEVMBlockchain(
  'SANTOS1-Chain',
  'xKVXXPvg8wpiTfaHbvFqFSW6LpkeqsbwyzPMqaobqitkx4P6J',
  new JEVMGasToken(FusionSANTOS1Asset),
  BigInt(95004),
  BigInt('4000000000'),
  FusionAddress,
  ['SANTOS1'],
  [FusionFUSION1Asset]
)
export const FusionPSG1Chain = new JEVMBlockchain(
  'PSG1-Chain',
  '2UKnvSeeyqAouFgZj8neMAoKxo8GpHqX7rmjcpHmDDUpw9mJru',
  new JEVMGasToken(FusionPSG1Asset),
  BigInt(95005),
  BigInt('5952000000000'),
  FusionAddress,
  ['PSG1'],
  [FusionFUSION1Asset]
)
export const FusionJUV1Chain = new JEVMBlockchain(
  'JUV1-Chain',
  'okC5rCZdSiLQsGpiu7NjcieUkasyLhS51581nYe98xft4Mkaf',
  new JEVMGasToken(FusionJUV1Asset),
  BigInt(95006),
  BigInt('153000000000'),
  FusionAddress,
  ['JUV1'],
  [FusionFUSION1Asset]
)
export const FusionGAL1Chain = new JEVMBlockchain(
  'GAL1-Chain',
  'Uhy3wiXzEAXBJz3dbSYktrtmvMsDiAnPvPLx86Q8znw8Hw45s',
  new JEVMGasToken(FusionGAL1Asset),
  BigInt(95007),
  BigInt('38181000000000'),
  FusionAddress,
  ['GAL1'],
  [FusionFUSION1Asset]
)
export const FusionOG1Chain = new JEVMBlockchain(
  'OG1-Chain',
  'puQqhmQ8Hhsr1wxmScohUFNdpkURe8BxwHmTCxXkVUVqVdGX3',
  new JEVMGasToken(FusionOG1Asset),
  BigInt(95008),
  BigInt('9524000000000'),
  FusionAddress,
  ['OG1'],
  [FusionFUSION1Asset]
)
export const FusionFORM1Chain = new JEVMBlockchain(
  'FORM1-Chain',
  '2c5ZSc6SfEg6ywSsyQhx2YejXWv7xm4HRsxUsEVs88LXYS4g7g',
  new JEVMGasToken(FusionFORM1Asset),
  BigInt(95009),
  BigInt('47194252000000000'),
  FusionAddress,
  ['FORM1'],
  [FusionFUSION1Asset]
)
export const FusionSAND1Chain = new JEVMBlockchain(
  'SAND1-Chain',
  '28bwwTGwr9okH1UgkVjXLMHjEnjjkjRzFW1PArhTUd4d1nXXdP',
  new JEVMGasToken(FusionSAND1Asset),
  BigInt(95010),
  BigInt('48000000000'),
  FusionAddress,
  ['SAND1'],
  [FusionFUSION1Asset]
)
export const FusionBRL1Chain = new JEVMBlockchain(
  'BRL1-Chain',
  '2t9XqLb8y5Qev5DB1KiKS8oZvzsGoJ53k5fgEtCTSejGDbEZgL',
  new JEVMGasToken(FusionBRL1Asset),
  BigInt(95011),
  BigInt('1701000000000'),
  FusionAddress,
  ['BRL1'],
  [FusionFUSION1Asset]
)
export const FusionAED1Chain = new JEVMBlockchain(
  'AED1-Chain',
  '2QsQZMPaLSKwZkMmiVCeEzKJozNEAev5dhWruEuQvwsoG852u4',
  new JEVMGasToken(FusionAED1Asset),
  BigInt(95012),
  BigInt('78372000000000'),
  FusionAddress,
  ['AED1'],
  [FusionFUSION1Asset]
)
export const FusionVUSD1Chain = new JEVMBlockchain(
  'vUSD1-Chain',
  '2mE4AKXkJjUojSs3y5wNgSVksVv7qFZd3LisNVQ63MzwgBSBb8',
  new JEVMGasToken(FusionVUSD1Asset),
  BigInt(95013),
  BigInt('6431000000000'),
  FusionAddress,
  ['vUSD1'],
  [FusionFUSION1Asset]
)
export const FusionMXN1Chain = new JEVMBlockchain(
  'MXN1-Chain',
  'sG1SqT5KQ68yZYjR3f2hY4dqqnFtBz61frqwDCaSV89dBmn7N',
  new JEVMGasToken(FusionMXN1Asset),
  BigInt(95014),
  BigInt('10151000000000'),
  FusionAddress,
  ['MXN1'],
  [FusionFUSION1Asset]
)

export const FusionPrimarySupernet = new PrimarySupernet(
  '11111111111111111111111111111111LpoYY',
  [
    FusionPlatformChain,
    FusionJVMChain,
    FusionFUSION1Chain,
    FusionSANTOS1Chain,
    FusionPSG1Chain,
    FusionJUV1Chain,
    FusionGAL1Chain,
    FusionOG1Chain,
    FusionFORM1Chain,
    FusionSAND1Chain,
    FusionBRL1Chain,
    FusionAED1Chain,
    FusionVUSD1Chain,
    FusionMXN1Chain
  ],
  FusionPlatformChain,
  FusionJVMChain,
  FusionFUSION1Chain
)

export const FusionNetwork = new MCN(
  FusionNetworkName,
  FusionAddress,
  FusionNetworkId,
  FusionHrp,
  FusionPrimarySupernet
)
