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

//
// ----- JNT Assets -----
//
export const FusionFUSN1Asset = new JNTAsset(
  '2Gi5ewBz7La9dPw4fV2wtAMRyjAydaW5BsrxRgCQnH2bdU6B5Q',
  'Fusion1',
  'FUSN1',
  9,
  false
)
export const FusionSANTOS1Asset = new JNTAsset(
  'G4UEgSDc1KRVZyN5o3Ck1yf2tWHSKgcoQdrJ39YNcPaMSMM2G',
  'Santos FC',
  'SANTOS1',
  9,
  false
)
export const FusionPSG1Asset = new JNTAsset(
  '2giVcsEctNrt2qJ9Fq9eY692DEjFw6dUG9kncSj6vUTsNgdjX1',
  'Paris Saint-Germain',
  'PSG1',
  9,
  false
)
export const FusionJUV1Asset = new JNTAsset(
  'atGZ6KYieKtW35xcHaC2LipJFjPSRKLV1uAboqUJNGB8PQHax',
  'Juventus',
  'JUV1',
  9,
  false
)
export const FusionGAL1Asset = new JNTAsset(
  '2nwY3DtNjFbE98SpxK26E4ZtGNrAvVh4u5nBimXbWeW5MgfTvp',
  'Galatasary',
  'GAL1',
  9,
  false
)
export const FusionOG1Asset = new JNTAsset(
  'BnFBHsz1zgerrHY1rhx1j94xkEwXEwpsgyreXXE67FZmTLqcY',
  'OG Fan',
  'OG1',
  9,
  false
)
export const FusionFORM1Asset = new JNTAsset(
  '2hokCBn3jmsdMh8yg8pP4y49RDB5scLupCEAfA8h6bh2HJt6aL',
  'Four',
  'FORM1',
  9,
  false
)
export const FusionSAND1Asset = new JNTAsset(
  '2RWZ5JSYceyNfuABw7bp2K5M5rRq23DFMpT24peTZFMaAvufVw',
  'The Sandbox',
  'SAND1',
  9,
  false
)
export const FusionBRL1Asset = new JNTAsset(
  '2anSgB4z74Nuk1vPPJhKK95pfXcXE8pbKEhMSouw2ofmRZeyNo',
  'Brazilian Real Token',
  'BRL1',
  9,
  false
)
export const FusionAED1Asset = new JNTAsset(
  'SMUQcbVsYqoTBdvfWjCTxVjCoN4ZUs7qwrMB3zqetTsaBZtdq',
  'United Arab Emirate Dirham Token',
  'AED1',
  9,
  false
)
export const FusionVUSD1Asset = new JNTAsset(
  'kabW1a6uzUKi277PNLbgisKZkv6rTF5SkFEgXfABx39J5tKH2',
  'Vaulted USD',
  'vUSD1',
  9,
  false
)
export const FusionMXN1Asset = new JNTAsset(
  'HjdiZpXajP9EPmA2JS9o2qxMPtAg9HRg8ef8aU8LVEC9qJhGT',
  'Mexican Peso Token',
  'MXN1',
  9,
  false
)
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
//
// ----- JRC20 Assets -----
//
const jrc20Assets: JRC20Asset[] = [
  new JRC20Asset('0x2d00000000000000000000000000000000000000', 'Santos FC', 'SANTOS', 9, FusionSANTOS1Asset.assetId),
  new JRC20Asset(
    '0x2e00000000000000000000000000000000000000',
    'Paris Saint-Germain',
    'PSG',
    9,
    FusionPSG1Asset.assetId
  ),
  new JRC20Asset('0x2f00000000000000000000000000000000000000', 'Juventus', 'JUV', 9, FusionJUV1Asset.assetId),
  new JRC20Asset('0x3000000000000000000000000000000000000000', 'Galatasary', 'GAL', 9, FusionGAL1Asset.assetId),
  new JRC20Asset('0x3100000000000000000000000000000000000000', 'OG Fan', 'OG', 9, FusionOG1Asset.assetId),
  new JRC20Asset('0x3200000000000000000000000000000000000000', 'Four', 'FORM', 9, FusionFORM1Asset.assetId),
  new JRC20Asset('0x3300000000000000000000000000000000000000', 'The Sandbox', 'SAND', 9, FusionSAND1Asset.assetId),
  new JRC20Asset(
    '0x3400000000000000000000000000000000000000',
    'Brazilian Real Token',
    'BRL',
    9,
    FusionBRL1Asset.assetId
  ),
  new JRC20Asset(
    '0x3500000000000000000000000000000000000000',
    'United Arab Emirate Dirham Token',
    'AED',
    9,
    FusionAED1Asset.assetId
  ),
  new JRC20Asset('0x3600000000000000000000000000000000000000', 'Vaulted USD', 'vUSD', 9, FusionVUSD1Asset.assetId),
  new JRC20Asset('0x3700000000000000000000000000000000000000', 'Mexican Peso Token', 'MXN', 9, FusionMXN1Asset.assetId)
]
export const FusionWFUSION1Asset = new WrappedAsset(
  '0x36aD1F7DCCbafAdC23Fcec2fAb1BEFE45e10b04A',
  'Wrapped Fusion1',
  'wFUSN1',
  18
)
//
// ----- CHAINS -----
//
export const FusionPlatformChain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  FusionFUSN1Asset,
  FusionStakeConfig,
  FusionRewardConfig,
  ['P'],
  jntAssets
)
export const FusionJVMChain = new JVMBlockchain(
  'JVM-Chain',
  '25hfdTrgTRW5aFHpx1revBr2p5amj8Lgcwb2Zb1z8zmrzB72aJ',
  FusionFUSN1Asset,
  ['JVM'],
  jntAssets
)
export const FusionFUSION1Chain = new JEVMBlockchain(
  'FUSION1-Chain',
  '2wQs1iaoYciQqz7BnV6GVYoNYNh1gRZtje5v9bKr2cxrUR8iiE',
  new JEVMGasToken(FusionFUSN1Asset),
  BigInt(95003),
  BigInt('2000000000'),
  FusionAddress,
  ['FUSION1'],
  jrc20Assets,
  jrc20Assets,
  FusionWFUSION1Asset
)
export const FusionSANTOS1Chain = new JEVMBlockchain(
  'SANTOS1-Chain',
  '55W5qPZstpD5Djj13u21fPg6m76JF7P9W3bakSRhwm5nqzk2E',
  new JEVMGasToken(FusionSANTOS1Asset),
  BigInt(95004),
  BigInt('199000000000'),
  FusionAddress,
  ['SANTOS1'],
  [FusionFUSN1Asset]
)
export const FusionPSG1Chain = new JEVMBlockchain(
  'PSG1-Chain',
  'TWoPYKgkbHFuuxVh7fzKWcNWW58jqF8sE4PeHw7rZrnokMh4Z',
  new JEVMGasToken(FusionPSG1Asset),
  BigInt(95005),
  BigInt('179000000000'),
  FusionAddress,
  ['PSG1'],
  [FusionFUSN1Asset]
)
export const FusionJUV1Chain = new JEVMBlockchain(
  'JUV1-Chain',
  '22xRmmDUwVrMbH4aJTC6oZLpr72k1wk3rRKUWoACBzuHGh5Q1J',
  new JEVMGasToken(FusionJUV1Asset),
  BigInt(95006),
  BigInt('394000000000'),
  FusionAddress,
  ['JUV1'],
  [FusionFUSN1Asset]
)
export const FusionGAL1Chain = new JEVMBlockchain(
  'GAL1-Chain',
  '2eZrGDYZwYm3i65C4bJaB7UGJtsuFfwzXX15JUPnfXuXcVa4HQ',
  new JEVMGasToken(FusionGAL1Asset),
  BigInt(95007),
  BigInt('169000000000'),
  FusionAddress,
  ['GAL1'],
  [FusionFUSN1Asset]
)
export const FusionOG1Chain = new JEVMBlockchain(
  'OG1-Chain',
  'Tq4sS8p7xHkMqnbP3TnujnGAeuND91pYFa3wxwgLFDGGNt38N',
  new JEVMGasToken(FusionOG1Asset),
  BigInt(95008),
  BigInt('169000000000'),
  FusionAddress,
  ['OG1'],
  [FusionFUSN1Asset]
)
export const FusionFORM1Chain = new JEVMBlockchain(
  'FORM1-Chain',
  '2ZQXpkUMqpd6hadAVENeUxo86MQHG1QYahZX2wBPpAN8xrq6F3',
  new JEVMGasToken(FusionFORM1Asset),
  BigInt(95009),
  BigInt('193000000000'),
  FusionAddress,
  ['FORM1'],
  [FusionFUSN1Asset]
)
export const FusionSAND1Chain = new JEVMBlockchain(
  'SAND1-Chain',
  '2o5UvJyqF6uSrZUzEXS9jjHCFLNeTtn48X7pBX4u2NaDXiCebc',
  new JEVMGasToken(FusionSAND1Asset),
  BigInt(95010),
  BigInt('183000000000'),
  FusionAddress,
  ['SAND1'],
  [FusionFUSN1Asset]
)
export const FusionBRL1Chain = new JEVMBlockchain(
  'BRL1-Chain',
  'bSBdSdxSU3vG54n9iptgDsy465pXy26kcZowrjAhHWJHeV2y6',
  new JEVMGasToken(FusionBRL1Asset),
  BigInt(95011),
  BigInt('2646000000000'),
  FusionAddress,
  ['BRL1'],
  [FusionFUSN1Asset]
)
export const FusionAED1Chain = new JEVMBlockchain(
  'AED1-Chain',
  '2AqXm4gF8V6BawpbCuZTDp5duAyebHvyLmSb1GtBKj46qaeLxK',
  new JEVMGasToken(FusionAED1Asset),
  BigInt(95012),
  BigInt('1764000000000'),
  FusionAddress,
  ['AED1'],
  [FusionFUSN1Asset]
)
export const FusionVUSD1Chain = new JEVMBlockchain(
  'vUSD1-Chain',
  'h7qk5YUxzL9ucZszrRXqQxxvzo2h8tYYJBVF4PE7LboF749Fh',
  new JEVMGasToken(FusionVUSD1Asset),
  BigInt(95013),
  BigInt('476000000000'),
  FusionAddress,
  ['vUSD1'],
  [FusionFUSN1Asset]
)
export const FusionMXN1Chain = new JEVMBlockchain(
  'MXN1-Chain',
  'HZtQQXBwYTpi96xoezUr1NrboKCHEUiqDSYSyRmegu9Y7V3Gh',
  new JEVMGasToken(FusionMXN1Asset),
  BigInt(95014),
  BigInt('8851000000000'),
  FusionAddress,
  ['MXN1'],
  [FusionFUSN1Asset]
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
