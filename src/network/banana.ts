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

export const BananaBANANA1AssetId = 'kufL8fbbsr1fkzJpHptZu5b9dDNDVf3EAnqNA79aerrhBPMRm'
export const BananaSOL1AssetId = '2ByMC1sVqvaWP1dWhqJUkD5bj2xUvrKEcF3aXbhpSpWPNFze5f'
export const BananaCOOKIE1AssetId = 'j3kykapHBmTUXQPHxG1KbPYJ5iXjHhFz8nGAbjz8sGZ4beVkD'
export const BananaTON1AssetId = '8t1rERnfiRTWTVuzHNjxa6iNciqZAC5TmvF2M2cxfxrjNtrfF'
export const BananaKPEPE1AssetId = '2PYLvGkhAPFNtWWTnAPoBQoTRmbehGdtwe2WuezGXXa3HjwtJ4'
export const BananaKFLOKI1AssetId = '2XSd5sSvnXeoFjYv1mDDPRCvqHy5KCASa3pCr6TR3TDQTwoCwt'
export const BananaKBONK1AssetId = 'F16HQNYy6t6RFyMsgDgWJsmiXfD6jkNduEdnyn9yUteTdfKyU'
export const BananaUSD1AssetId = 'Kt2nGF9sEJ4jCJx5T2MR91fSnKnL5iEkBPMNCrvz7CzerUuzy'
export const BananaKNC1AssetId = '2oA7Puu3L55PptSpxUKFFKddKsDVrnPev6i3sbWEJkDohjbaRq'
export const BananaLUNA1AssetId = '2rRGsoNxTpiPxPLvYTmFaAvhhSQzCtK5UAbxaBUsGWPYqNKrDe'
export const BananaAIXBT1AssetId = 'viXEySwjdtp17ZMtdvZUCFbQV94GkrAF2Sng8xNCQBRBJzT8B'
export const BananaVIRTUAL1AssetId = 'C2eZ4zRifm3uSAy3cEpbtDWLb7eMiC7GZ6g3GihGxwqV54djZ'

export const BananaBANANA1Asset = new JNTAsset(BananaBANANA1AssetId, 'BANANA1', 'BANA', 9, false)
export const BananaSOL1Asset = new JNTAsset(BananaSOL1AssetId, 'Solana', 'SOL1', 9, false)
export const BananaCOOKIE1Asset = new JNTAsset(BananaCOOKIE1AssetId, 'Cookie DAO', 'COOKIE1', 9, false)
export const BananaTON1Asset = new JNTAsset(BananaTON1AssetId, 'Toncoin', 'TON1', 9, false)
export const BananaKPEPE1Asset = new JNTAsset(BananaKPEPE1AssetId, 'Pepe', 'kPEPE1', 9, false)
export const BananaKFLOKI1Asset = new JNTAsset(BananaKFLOKI1AssetId, 'FLOKI', 'kFLOKI1', 9, false)
export const BananaKBONK1Asset = new JNTAsset(BananaKBONK1AssetId, 'Bonk1', 'kBONK1', 9, false)
export const BananaUSD1Asset = new JNTAsset(BananaUSD1AssetId, 'Usd1', 'USD1', 9, false)
export const BananaKNC1Asset = new JNTAsset(BananaKNC1AssetId, 'Kyber Network Crystal V2', 'KNC1', 9, false)
export const BananaLUNA1Asset = new JNTAsset(BananaLUNA1AssetId, 'Luna', 'LUNA1', 9, false)
export const BananaAIXBT1Asset = new JNTAsset(BananaAIXBT1AssetId, 'Aixbt', 'AIXBT1', 9, false)
export const BananaVIRTUAL1Asset = new JNTAsset(BananaVIRTUAL1AssetId, 'Virtual', 'VIRTUAL1', 9, false)
// BANANA1 is omitted here because it should be registered by default as the chain asset
const jntAssets: JNTAsset[] = [
  BananaSOL1Asset,
  BananaCOOKIE1Asset,
  BananaTON1Asset,
  BananaKPEPE1Asset,
  BananaKFLOKI1Asset,
  BananaKBONK1Asset,
  BananaUSD1Asset,
  BananaKNC1Asset,
  BananaLUNA1Asset,
  BananaAIXBT1Asset,
  BananaVIRTUAL1Asset
]

export const BananaPlatformChain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  BananaBANANA1Asset,
  BananaStakeConfig,
  BananaRewardConfig,
  ['P'],
  jntAssets
)
export const BananaJVMChain = new JVMBlockchain(
  'JVM-Chain',
  '2EKWB4RwWouir9iBUiHJjebwg8RByDQaYVoFLKa4C3pZAP4A1m',
  BananaBANANA1Asset,
  ['JVM'],
  jntAssets
)
const jrc20Assets: JRC20Asset[] = [
  new JRC20Asset('0x2d00000000000000000000000000000000000000', 'Solana', 'SOL', 9, BananaSOL1AssetId),
  new JRC20Asset('0x2e00000000000000000000000000000000000000', 'CookieDAO', 'COOKIE', 9, BananaCOOKIE1AssetId),
  new JRC20Asset('0x2f00000000000000000000000000000000000000', 'Toncoin', 'TON', 9, BananaTON1AssetId),
  new JRC20Asset('0x3000000000000000000000000000000000000000', 'Pepe', 'kPEPE', 9, BananaKPEPE1AssetId),
  new JRC20Asset('0x3100000000000000000000000000000000000000', 'FLOKI', 'kFLOKI', 9, BananaKFLOKI1AssetId),
  new JRC20Asset('0x3200000000000000000000000000000000000000', 'Bonk', 'kBONK', 9, BananaKBONK1AssetId),
  new JRC20Asset('0x3300000000000000000000000000000000000000', 'USD1', 'USD1', 9, BananaUSD1AssetId),
  new JRC20Asset('0x3400000000000000000000000000000000000000', 'Kyber Crystal Network V2', 'KNC', 9, BananaKNC1AssetId),
  new JRC20Asset('0x3500000000000000000000000000000000000000', 'Luna', 'LUNA', 9, BananaLUNA1AssetId),
  new JRC20Asset('0x3600000000000000000000000000000000000000', 'Aixbt', 'AIXBT', 9, BananaAIXBT1AssetId),
  new JRC20Asset(
    '0x3700000000000000000000000000000000000000',
    'Virtuals Protocols',
    'VIRTUAL',
    9,
    BananaVIRTUAL1AssetId
  )
]
export const BananaWBANANA1Asset = new WrappedAsset(
  '0x466e8b1156e49D29B70447a9Af68038cF5562BdD',
  'Wrapped BANANA1',
  'wBANA',
  18
)
export const BananaBANANA1Chain = new JEVMBlockchain(
  'BANANA1-Chain',
  '2AuwJiL43gQrawiexK7ciSWvQzBsVj9VWWi1uJstLXDQprbWH7',
  new JEVMGasToken(BananaBANANA1Asset),
  BigInt(65003),
  BigInt('2000000000'),
  BananaAddress,
  ['BANANA1'],
  jrc20Assets,
  jrc20Assets
  // BananaWBANANA1Asset,
)
export const BananaSOL1Chain = new JEVMBlockchain(
  'SOL1-Chain',
  'twKq48jFiKqYfvMQaxoxV7dh33CBXbtyULrVZ2qyH3uuku6mU',
  new JEVMGasToken(BananaSOL1Asset),
  BigInt(65004),
  BigInt('4000000000'),
  BananaAddress,
  ['SOL1'],
  [BananaBANANA1Asset]
)
export const BananaCOOKIE1Chain = new JEVMBlockchain(
  'COOKIE1-Chain',
  'geNYWPzLHuBymUubA3Vyb4y5vgASCYnAxUSeTmRy6Qia3FZ14',
  new JEVMGasToken(BananaCOOKIE1Asset),
  BigInt(65005),
  BigInt('5952000000000'),
  BananaAddress,
  ['COOKIE1'],
  [BananaBANANA1Asset]
)
export const BananaTON1Chain = new JEVMBlockchain(
  'TON1-Chain',
  '2mbAmSAKvp7DQfXVYYwj6mQ5PS5JnTQqWTAq515i5a7FEPrVo7',
  new JEVMGasToken(BananaTON1Asset),
  BigInt(65006),
  BigInt('153000000000'),
  BananaAddress,
  ['TON1'],
  [BananaBANANA1Asset]
)
export const BananaKPEPE1Chain = new JEVMBlockchain(
  'kPEPE1-Chain',
  '2CaayzuahcWNxz1Zrra9c5vTB1bFrQ8PKZ4obnRQamNUgHEQbv',
  new JEVMGasToken(BananaKPEPE1Asset),
  BigInt(65007),
  BigInt('38181000000000'),
  BananaAddress,
  ['kPEPE1'],
  [BananaBANANA1Asset]
)
export const BananaKFLOKI1Chain = new JEVMBlockchain(
  'kFLOKI1-Chain',
  'CzY2Ad1wYbAEGuv27ueKSgNnWdyrwumsLBdtbSXwGj7Ez7QNv',
  new JEVMGasToken(BananaKFLOKI1Asset),
  BigInt(65008),
  BigInt('9524000000000'),
  BananaAddress,
  ['kFLOKI1'],
  [BananaBANANA1Asset]
)
export const BananaKBONK1Chain = new JEVMBlockchain(
  'kBONK1-Chain',
  'RcDkr3wQx1kY214j7KJAve34xx16mH4WHu3F5XC9TehHPaU3F',
  new JEVMGasToken(BananaKBONK1Asset),
  BigInt(65009),
  BigInt('47194252000000000'),
  BananaAddress,
  ['kBONK1'],
  [BananaBANANA1Asset]
)
export const BananaUSD1Chain = new JEVMBlockchain(
  'USD1-Chain',
  '2hLg72aui7ovxnv4Qpzt7mZ2UC5nb2SJfSVQtcHVkGuPwsKANC',
  new JEVMGasToken(BananaUSD1Asset),
  BigInt(65010),
  BigInt('48000000000'),
  BananaAddress,
  ['USD1'],
  [BananaBANANA1Asset]
)
export const BananaKNC1Chain = new JEVMBlockchain(
  'KNC1-Chain',
  'Jdxkkd4zNSBtr6i3gp2xWfSK3qmgkGs5rGfS98FT5Bri6CkA7',
  new JEVMGasToken(BananaKNC1Asset),
  BigInt(65011),
  BigInt('1701000000000'),
  BananaAddress,
  ['KNC1'],
  [BananaBANANA1Asset]
)
export const BananaLUNA1Chain = new JEVMBlockchain(
  'LUNA1-Chain',
  'okHa8Bikqk9HporjfmYv8g6xkTHgagqE89A2KYiL6XzUy4XbD',
  new JEVMGasToken(BananaLUNA1Asset),
  BigInt(65012),
  BigInt('78372000000000'),
  BananaAddress,
  ['LUNA1'],
  [BananaBANANA1Asset]
)
export const BananaAIXBT1Chain = new JEVMBlockchain(
  'AIXBT1-Chain',
  'p6F7HnXHErg6Y4rJ6r3ujarRLqT3TNoaGtrVtAUbetTyahLEn',
  new JEVMGasToken(BananaAIXBT1Asset),
  BigInt(65013),
  BigInt('6431000000000'),
  BananaAddress,
  ['AIXBT1'],
  [BananaBANANA1Asset]
)
export const BananaVIRTUAL1Chain = new JEVMBlockchain(
  'VIRTUAL1-Chain',
  'SdVPjzWKW4Q7LcPHrcuuh6wnMFy4a3fThY3uVCCdM1TyzYYFQ',
  new JEVMGasToken(BananaVIRTUAL1Asset),
  BigInt(65014),
  BigInt('10151000000000'),
  BananaAddress,
  ['VIRTUAL1'],
  [BananaBANANA1Asset]
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
    BananaUSD1Chain,
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
