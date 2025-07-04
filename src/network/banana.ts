import { JEVMGasToken, JNTAsset, JRC20Asset, WrappedAsset } from '../asset'
import { JEVMBlockchain, JVMBlockchain, PlatformBlockchain, RewardConfig, StakeConfig } from '../chain'
import { MCN, PrimarySupernet } from './network'

const BananaNetworkName = 'Banana1 Supernet'
const BananaNetworkId = 47
const BananaHrp = 'banana'
const BananaStakeConfig = new StakeConfig(
  0.8, // 80%
  BigInt(20_000000000), // 20 BANANA1
  BigInt(30_000_000000000), // 30_000 BANANA1
  BigInt(1_000000), // 0.1 BANANA1
  5_0000, // 5%
  5_0000, // 5%
  BigInt(14 * 86_400), // 14 days
  BigInt(365 * 86_400) // 365 days
)
const BananaRewardConfig = new RewardConfig(
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
const BananaAddress = 'https://rpc.banana1-mainnet.network'

//
// ----- JNT Assets -----
//
export const BananaBANA1Asset = new JNTAsset(
  '3XvKg3uJCsGdkPFbwTMKgUJxyWDBMmHAFinQ9LKvcwTmgnQMg',
  'Banana1',
  'BANA1',
  9,
  false
)
export const BananaSOL1Asset = new JNTAsset(
  '2ByMC1sVqvaWP1dWhqJUkD5bj2xUvrKEcF3aXbhpSpWPNFze5f',
  'Solana',
  'SOL1',
  9,
  false
)
export const BananaCOOKIE1Asset = new JNTAsset(
  'chZWmyeHPvmyXi1bd3Yp3orxvkAnTzRDdxomeLv9UdsCmTfKJ',
  'Cookie DAO',
  'COOKIE1',
  9,
  false
)
export const BananaTON1Asset = new JNTAsset(
  '8t1rERnfiRTWTVuzHNjxa6iNciqZAC5TmvF2M2cxfxrjNtrfF',
  'Toncoin',
  'TON1',
  9,
  false
)
export const BananaKPEPE1Asset = new JNTAsset(
  '2PYLvGkhAPFNtWWTnAPoBQoTRmbehGdtwe2WuezGXXa3HjwtJ4',
  'Pepe',
  'kPEPE1',
  9,
  false
)
export const BananaKFLOKI1Asset = new JNTAsset(
  '2XSd5sSvnXeoFjYv1mDDPRCvqHy5KCASa3pCr6TR3TDQTwoCwt',
  'FLOKI',
  'kFLOKI1',
  9,
  false
)
export const BananaKBONK1Asset = new JNTAsset(
  'BamR7ie55TobPfpWLBaLHGkGNVfWH8qPm2AGUasBTsaeqxAht',
  'Bonk1',
  'kBONK1',
  9,
  false
)
export const BananaUSDC1Asset = new JNTAsset(
  'y4ASDXGT9oV7yFvnkS4hB76Rnax9wkW3yegZtmtLrrE8aG7fE',
  'USDC1',
  'USDC1',
  9,
  false
)
export const BananaKNC1Asset = new JNTAsset(
  '2oA7Puu3L55PptSpxUKFFKddKsDVrnPev6i3sbWEJkDohjbaRq',
  'Kyber Network Crystal V2',
  'KNC1',
  9,
  false
)
export const BananaLUNA1Asset = new JNTAsset(
  '2rRGsoNxTpiPxPLvYTmFaAvhhSQzCtK5UAbxaBUsGWPYqNKrDe',
  'Luna',
  'LUNA1',
  9,
  false
)
export const BananaAIXBT1Asset = new JNTAsset(
  'viXEySwjdtp17ZMtdvZUCFbQV94GkrAF2Sng8xNCQBRBJzT8B',
  'Aixbt',
  'AIXBT1',
  9,
  false
)
export const BananaVIRTUAL1Asset = new JNTAsset(
  'C2eZ4zRifm3uSAy3cEpbtDWLb7eMiC7GZ6g3GihGxwqV54djZ',
  'Virtual',
  'VIRTUAL1',
  9,
  false
)
// BANANA1 is omitted here because it should be registered by default as the chain asset
const jntAssets: JNTAsset[] = [
  BananaSOL1Asset,
  BananaCOOKIE1Asset,
  BananaTON1Asset,
  BananaKPEPE1Asset,
  BananaKFLOKI1Asset,
  BananaKBONK1Asset,
  BananaUSDC1Asset,
  BananaKNC1Asset,
  BananaLUNA1Asset,
  BananaAIXBT1Asset,
  BananaVIRTUAL1Asset
]
//
// ----- JRC20 Assets -----
//
const jrc20Assets: JRC20Asset[] = [
  new JRC20Asset('0x2d00000000000000000000000000000000000000', 'Solana', 'SOL', 9, BananaSOL1Asset.assetId),
  new JRC20Asset('0x2e00000000000000000000000000000000000000', 'CookieDAO', 'COOKIE', 9, BananaCOOKIE1Asset.assetId),
  new JRC20Asset('0x2f00000000000000000000000000000000000000', 'Toncoin', 'TON', 9, BananaTON1Asset.assetId),
  new JRC20Asset('0x3000000000000000000000000000000000000000', 'Pepe', 'kPEPE', 9, BananaKPEPE1Asset.assetId),
  new JRC20Asset('0x3100000000000000000000000000000000000000', 'FLOKI', 'kFLOKI', 9, BananaKFLOKI1Asset.assetId),
  new JRC20Asset('0x3200000000000000000000000000000000000000', 'Bonk', 'kBONK', 9, BananaKBONK1Asset.assetId),
  new JRC20Asset('0x3300000000000000000000000000000000000000', 'USDC1', 'USDC1', 9, BananaUSDC1Asset.assetId),
  new JRC20Asset(
    '0x3400000000000000000000000000000000000000',
    'Kyber Crystal Network V2',
    'KNC',
    9,
    BananaKNC1Asset.assetId
  ),
  new JRC20Asset('0x3500000000000000000000000000000000000000', 'Luna', 'LUNA', 9, BananaLUNA1Asset.assetId),
  new JRC20Asset('0x3600000000000000000000000000000000000000', 'Aixbt', 'AIXBT', 9, BananaAIXBT1Asset.assetId),
  new JRC20Asset(
    '0x3700000000000000000000000000000000000000',
    'Virtuals Protocols',
    'VIRTUAL',
    9,
    BananaVIRTUAL1Asset.assetId
  )
]
export const BananaWBANANA1Asset = new WrappedAsset(
  '0x36aD1F7DCCbafAdC23Fcec2fAb1BEFE45e10b04A',
  'Wrapped Banana1',
  'wBANA1',
  18
)
//
// ----- CHAINS -----
//
export const BananaPlatformChain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  BananaBANA1Asset,
  BananaStakeConfig,
  BananaRewardConfig,
  ['P'],
  jntAssets
)
export const BananaJVMChain = new JVMBlockchain(
  'JVM-Chain',
  '2UwbPXmtvvmAxioSkF568qvX7wkfqLpvoMQPRDMkwuM6pAsik3',
  BananaBANA1Asset,
  ['JVM'],
  jntAssets
)
export const BananaBANANA1Chain = new JEVMBlockchain(
  'BANANA1-Chain',
  '26fyLe8Ep9ACyUGJJkArrB1fwee24wYKmEjsKUaEY6818w8Jen',
  new JEVMGasToken(BananaBANA1Asset),
  BigInt(65003),
  BigInt('2000000000'),
  BananaAddress,
  ['BANANA1'],
  jrc20Assets,
  jrc20Assets,
  BananaWBANANA1Asset
)
export const BananaSOL1Chain = new JEVMBlockchain(
  'SOL1-Chain',
  '2qvLJR3CdKuoCvy1ojLXpcAfEMWqARiAS2fVhBFx7gZqqkLMLp',
  new JEVMGasToken(BananaSOL1Asset),
  BigInt(65004),
  BigInt('4000000000'),
  BananaAddress,
  ['SOL1'],
  [BananaBANA1Asset]
)
export const BananaCOOKIE1Chain = new JEVMBlockchain(
  'COOKIE1-Chain',
  'X1kbw1KT2Jezftue2B8f4FfJMGZRkaKguhWa7MsJB6eKrfNib',
  new JEVMGasToken(BananaCOOKIE1Asset),
  BigInt(65005),
  BigInt('5952000000000'),
  BananaAddress,
  ['COOKIE1'],
  [BananaBANA1Asset]
)
export const BananaTON1Chain = new JEVMBlockchain(
  'TON1-Chain',
  'uztHHs7zPqDMvQJAxX6bkCG3TJoUzJ6BYM2yTPF97WYiUZ7D8',
  new JEVMGasToken(BananaTON1Asset),
  BigInt(65006),
  BigInt('153000000000'),
  BananaAddress,
  ['TON1'],
  [BananaBANA1Asset]
)
export const BananaKPEPE1Chain = new JEVMBlockchain(
  'kPEPE1-Chain',
  'HE3oYaPT4zu2Jm6SgyveWiMuMABKGtboLRVg5xF7kpkhD9Rdt',
  new JEVMGasToken(BananaKPEPE1Asset),
  BigInt(65007),
  BigInt('38181000000000'),
  BananaAddress,
  ['kPEPE1'],
  [BananaBANA1Asset]
)
export const BananaKFLOKI1Chain = new JEVMBlockchain(
  'kFLOKI1-Chain',
  '2WvGgAmqQyhSWA5ekPgAcxsNjUabpHP5XGLHHqyNHnhvkFcTLF',
  new JEVMGasToken(BananaKFLOKI1Asset),
  BigInt(65008),
  BigInt('9524000000000'),
  BananaAddress,
  ['kFLOKI1'],
  [BananaBANA1Asset]
)
export const BananaKBONK1Chain = new JEVMBlockchain(
  'kBONK1-Chain',
  'xg8L8oXQHQSxTPGtX6rBeR86jBNnKXQn99LXz5FwVoJePsSD3',
  new JEVMGasToken(BananaKBONK1Asset),
  BigInt(65009),
  BigInt('47194252000000000'),
  BananaAddress,
  ['kBONK1'],
  [BananaBANA1Asset]
)
export const BananaUSDC1Chain = new JEVMBlockchain(
  'USDC1-Chain',
  'mGTLPpQfjZXE5fp92aKZtvJytxcbD2cne7V1nKyapAjcGnq3',
  new JEVMGasToken(BananaUSDC1Asset),
  BigInt(65010),
  BigInt('48000000000'),
  BananaAddress,
  ['USDC1'],
  [BananaBANA1Asset]
)
export const BananaKNC1Chain = new JEVMBlockchain(
  'KNC1-Chain',
  'ACNM8xxcJRtVxK5C2KKy7oAMGKxSqH6N4EsmPpeYKwgMHseNd',
  new JEVMGasToken(BananaKNC1Asset),
  BigInt(65011),
  BigInt('1701000000000'),
  BananaAddress,
  ['KNC1'],
  [BananaBANA1Asset]
)
export const BananaLUNA1Chain = new JEVMBlockchain(
  'LUNA1-Chain',
  'xEoet1EWLDejGY4dyabi2qNWzuvBYSWNgRyauZh93pBN4e1ME',
  new JEVMGasToken(BananaLUNA1Asset),
  BigInt(65012),
  BigInt('78372000000000'),
  BananaAddress,
  ['LUNA1'],
  [BananaBANA1Asset]
)
export const BananaAIXBT1Chain = new JEVMBlockchain(
  'AIXBT1-Chain',
  'pgMBYVwALFSwsqFvxoLqaPPWdnTexNArDBdHF37c699Ye2nu7',
  new JEVMGasToken(BananaAIXBT1Asset),
  BigInt(65013),
  BigInt('6431000000000'),
  BananaAddress,
  ['AIXBT1'],
  [BananaBANA1Asset]
)
export const BananaVIRTUAL1Chain = new JEVMBlockchain(
  'VIRTUAL1-Chain',
  '2i8AMVYXtyPXnfpWBt4NSHq8mzyax4b9aAQkxPQmzyk9zqbcnA',
  new JEVMGasToken(BananaVIRTUAL1Asset),
  BigInt(65014),
  BigInt('10151000000000'),
  BananaAddress,
  ['VIRTUAL1'],
  [BananaBANA1Asset]
)

export const BananaPrimarySupernet = new PrimarySupernet(
  '11111111111111111111111111111111LpoYY',
  [
    BananaPlatformChain,
    BananaJVMChain,
    BananaBANANA1Chain,
    BananaSOL1Chain,
    BananaCOOKIE1Chain,
    BananaTON1Chain,
    BananaKPEPE1Chain,
    BananaKFLOKI1Chain,
    BananaKBONK1Chain,
    BananaUSDC1Chain,
    BananaKNC1Chain,
    BananaLUNA1Chain,
    BananaAIXBT1Chain,
    BananaVIRTUAL1Chain
  ],
  BananaPlatformChain,
  BananaJVMChain,
  BananaBANANA1Chain
)

export const BananaNetwork = new MCN(
  BananaNetworkName,
  BananaAddress,
  BananaNetworkId,
  BananaHrp,
  BananaPrimarySupernet
)
