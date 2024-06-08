import { JEVMGasToken, JNTAsset, JRC20Asset, WrappedAsset } from '../asset'
import { JEVMBlockchain, JVMBlockchain, PlatformBlockchain, RewardConfig, StakeConfig } from '../chain'
import { MCN, MCNAccess, PrimarySupernet } from './network'

const SocotraNetworkId: number = 46
const SocotraHrp: string = 'socotra'
const SocotraStakeConfig: StakeConfig = new StakeConfig(
  0.8, // 80%
  BigInt(1_000000000), // 1 JUNE
  BigInt(1_000_000_000000000), // 1_000_000 JUNE
  BigInt(1_00000000), // 0.1 JUNE
  12_0000, // 12%
  12_0000, // 12%
  BigInt(14 * 86_400), // 14 days
  BigInt(365 * 86_400) // 365 days
)
const SocotraRewardConfig: RewardConfig = new RewardConfig(
  BigInt(1_209_600), // 14 day
  BigInt(31_536_000), // 365 days
  BigInt(2_0000), // 2%
  BigInt(1711922400), // 1st April 2024
  BigInt(21_5000), // 21.5%
  BigInt(1838160000), // 1st April 2028
  BigInt(19_5000), // 19.5%
  BigInt(1869696000), // 1st April 2029
  BigInt(6_7000) // 6.7%
)
const SocotraAddress: string = 'https://rpc.socotra-testnet.network'
const SocotraStaticAddresses = ['https://api1.socotra-testnet.network', 'https://api2.socotra-testnet.network']

export const SocotraJUNEAssetId: string = 'HviVNFzh2nCqyi7bQxw6pt5fUPjZC8r3DCDrt7mRmScZS2zp5'
export const SocotraUSDT1AssetId: string = 'Ld5aCozSMQ1hC5jdXS3mhGNgoYVjVDe8zPTtPSbs4xS5JQSfJ'
export const SocotraUSD1AssetId: string = '2A1NW7YEoPSaKGy2LWUnbqiw2nFUTUt8rk9wzTzqZaqG2w7aB4'
export const SocotraDAI1AssetId: string = 'jB86KaCskBuRjqA6cUeyy2GtWpdF2i9MigV6yuGekojmTbQTC'
export const SocotraEUR1AssetId: string = '2CkzBNwEKvreEwYp2froWJePpXfruZu6iemJVfNqUAtVjJDRkp'
export const SocotraSGD1AssetId: string = '2Bi6ovdELbjXhSxs9fQTMPWUHcCbvJJZV4pHLkwcQyD7dDrqLG'
export const SocotraGLD1AssetId: string = 'HNihfvex33EDsuHuQddQpBpwUtkotLwnt54aj7GkGrxY9mLGz'
export const SocotraMBTC1AssetId: string = '2oWo7iw26bbY2bAt9pFfbFpTCnFVVY2CePDHM4tjTeV7e4FPoQ'
export const SocotraDOGE1AssetId: string = '47Y4SGbEzTCQ1DCzBaSnE34qTuQH7MBV99FsFHptodbQEn32u'
export const SocotraLTC1AssetId: string = '27LfLHoSPYdspLG8QwMjvRby2XfLKS8eCZt2mTnJXM65fAduVv'
export const SocotraBCH1AssetId: string = '2RBX4TiRmUxU1FsmNmEgdEGcFtgPr9NTGqnm5f33mK8adciKsA'
export const SocotraLINK1AssetId: string = '2No8EzWaiCH7TQUh3bUqaKhAY6TLxe8doo15ftvtnkgvGLX9K9'

export const SocotraJUNEAsset: JNTAsset = new JNTAsset(SocotraJUNEAssetId, 'JUNE', 'JUNE', 9, false)
export const SocotraUSDT1Asset: JNTAsset = new JNTAsset(SocotraUSDT1AssetId, 'USDT1', 'USDT1', 9, false)
export const SocotraUSD1Asset: JNTAsset = new JNTAsset(SocotraUSD1AssetId, 'USD1', 'USD1', 9, false)
export const SocotraDAI1Asset: JNTAsset = new JNTAsset(SocotraDAI1AssetId, 'DAI1', 'DAI1', 9, false)
export const SocotraEUR1Asset: JNTAsset = new JNTAsset(SocotraEUR1AssetId, 'EUR1', 'EUR1', 9, false)
export const SocotraSGD1Asset: JNTAsset = new JNTAsset(SocotraSGD1AssetId, 'SGD1', 'SGD1', 9, false)
export const SocotraGLD1Asset: JNTAsset = new JNTAsset(SocotraGLD1AssetId, 'GLD1', 'GLD1', 9, false)
export const SocotraMBTC1Asset: JNTAsset = new JNTAsset(SocotraMBTC1AssetId, 'mBTC1', 'mBTC1', 9, false)
export const SocotraDOGE1Asset: JNTAsset = new JNTAsset(SocotraDOGE1AssetId, 'DOGE1', 'DOGE1', 9, false)
export const SocotraLTC1Asset: JNTAsset = new JNTAsset(SocotraLTC1AssetId, 'LTC1', 'LTC1', 9, false)
export const SocotraBCH1Asset: JNTAsset = new JNTAsset(SocotraBCH1AssetId, 'BCH1', 'BCH1', 9, false)
export const SocotraLINK1Asset: JNTAsset = new JNTAsset(SocotraLINK1AssetId, 'LINK1', 'LINK1', 9, false)
// JUNE is omitted here because it should be registered by default as the chain asset
const jntAssets: JNTAsset[] = [
  SocotraUSDT1Asset,
  SocotraUSD1Asset,
  SocotraDAI1Asset,
  SocotraEUR1Asset,
  SocotraSGD1Asset,
  SocotraGLD1Asset,
  SocotraMBTC1Asset,
  SocotraDOGE1Asset,
  SocotraLTC1Asset
]

export const SocotraPlatformChain: PlatformBlockchain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  SocotraJUNEAsset,
  SocotraStakeConfig,
  SocotraRewardConfig,
  ['P'],
  jntAssets
)
export const SocotraJVMChain: JVMBlockchain = new JVMBlockchain(
  'JVM-Chain',
  '267FL4rbQnXp6AmsSmQfyWwxi36VUKmE2tvAmfMLebB1kkVKyn',
  SocotraJUNEAsset,
  ['JVM'],
  jntAssets
)
const jrc20Assets: JRC20Asset[] = [
  new JRC20Asset('0x2d00000000000000000000000000000000000000', 'USDT.e', 'USDT.e', 9, SocotraUSDT1AssetId),
  new JRC20Asset('0x2e00000000000000000000000000000000000000', 'USD1.e', 'USD1.e', 9, SocotraUSD1AssetId),
  new JRC20Asset('0x2f00000000000000000000000000000000000000', 'DAI.e', 'DAI.e', 9, SocotraDAI1AssetId),
  new JRC20Asset('0x3000000000000000000000000000000000000000', 'EUR1.e', 'EUR1.e', 9, SocotraEUR1AssetId),
  new JRC20Asset('0x3100000000000000000000000000000000000000', 'SGD1.e', 'SGD1.e', 9, SocotraSGD1AssetId),
  new JRC20Asset('0x3200000000000000000000000000000000000000', 'GLD1.e', 'GLD1.e', 9, SocotraGLD1AssetId),
  new JRC20Asset('0x3300000000000000000000000000000000000000', 'mBTC.a', 'mBTC.a', 9, SocotraMBTC1AssetId),
  new JRC20Asset('0x3400000000000000000000000000000000000000', 'DOGE.b', 'DOGE.b', 9, SocotraDOGE1AssetId),
  new JRC20Asset('0x3500000000000000000000000000000000000000', 'LTC.b', 'LTC.b', 9, SocotraLTC1AssetId),
  new JRC20Asset('0x3600000000000000000000000000000000000000', 'BCH.b', 'BCH.b', 9, SocotraBCH1AssetId),
  new JRC20Asset('0x3700000000000000000000000000000000000000', 'LINK.e', 'LINK.e', 9, SocotraLINK1AssetId)
]
export const SocotraWJUNEAsset: WrappedAsset = new WrappedAsset(
  '0xC984ae20d0Fed3B974959BCbd1721167214CDeD9',
  'Wrapped JUNE',
  'wJUNE',
  18
)
export const SocotraJUNEChain: JEVMBlockchain = new JEVMBlockchain(
  'JUNE-Chain',
  'BUDQJ63154EiJZwwvukRB1tX3yQCDQdoEYYuCNKEruQ9MjRs4',
  new JEVMGasToken(SocotraJUNEAsset),
  BigInt(101003),
  BigInt('144000000000'),
  SocotraAddress,
  ['JUNE'],
  jrc20Assets,
  jrc20Assets,
  SocotraWJUNEAsset
)
export const SocotraUSDT1Chain: JEVMBlockchain = new JEVMBlockchain(
  'USDT1-Chain',
  'vFZ8cj9v4SMPn4nvcmSw7KuxCvK9kLQq4u2wnTUFMzhUehwUN',
  new JEVMGasToken(SocotraUSDT1Asset),
  BigInt(101005),
  BigInt('1429000000000'),
  SocotraAddress,
  ['USDT1'],
  [SocotraJUNEAsset]
)
export const SocotraUSD1Chain: JEVMBlockchain = new JEVMBlockchain(
  'USD1-Chain',
  'ZQPGzRK45hrGtYquC6G6W6LGUJzFtjd9dkfN5e1csqwKFUpdF',
  new JEVMGasToken(SocotraUSD1Asset),
  BigInt(101006),
  BigInt('1429000000000'),
  SocotraAddress,
  ['USD1'],
  [SocotraJUNEAsset]
)
export const SocotraDAI1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DAI1-Chain',
  'FH3XBUJ4d8bAWNo7vt7cHp4MJhPiSQR3Ez6GpXfDo3moGjfBi',
  new JEVMGasToken(SocotraDAI1Asset),
  BigInt(101004),
  BigInt('1429000000000'),
  SocotraAddress,
  ['DAI1'],
  [SocotraJUNEAsset]
)
export const SocotraEUR1Chain: JEVMBlockchain = new JEVMBlockchain(
  'EUR1-Chain',
  '2izgay6FwgxGZ2TyEgTQoeECCbCzhepRnDY6NQqu7ZFmmNL7FF',
  new JEVMGasToken(SocotraEUR1Asset),
  BigInt(101011),
  BigInt('1299000000000'),
  SocotraAddress,
  ['EUR1'],
  [SocotraJUNEAsset]
)
export const SocotraSGD1Chain: JEVMBlockchain = new JEVMBlockchain(
  'SGD1-Chain',
  '2j95jGv62HT5r9ZVCszvCBqMaNhRg8c2fLiSBQePf779Z8utAS',
  new JEVMGasToken(SocotraSGD1Asset),
  BigInt(101012),
  BigInt('1905000000000'),
  SocotraAddress,
  ['SGD1'],
  [SocotraJUNEAsset]
)
export const SocotraGLD1Chain: JEVMBlockchain = new JEVMBlockchain(
  'GLD1-Chain',
  'LNgHMND752eLwbdS9UL95zijQ2imBfFVi8QRzPvSzRWGrh59S',
  new JEVMGasToken(SocotraGLD1Asset),
  BigInt(101008),
  BigInt('1000000000'),
  SocotraAddress,
  ['GLD1'],
  [SocotraJUNEAsset]
)
export const SocotraMBTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'mBTC1-Chain',
  '2f1fGVRDot1V5CYeoiAN49LYrEBWmsZgnDXguvQ6u8YKdjqRGv',
  new JEVMGasToken(SocotraMBTC1Asset),
  BigInt(101007),
  BigInt('22000000000'),
  SocotraAddress,
  ['mBTC1'],
  [SocotraJUNEAsset]
)
export const SocotraDOGE1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DOGE1-Chain',
  'ubeHKfPPjBnNvf1chqnpfXCnusJAQxJeHNCZLgwR435ifTm9X',
  new JEVMGasToken(SocotraDOGE1Asset),
  BigInt(101010),
  BigInt('9524000000000'),
  SocotraAddress,
  ['DOGE1'],
  [SocotraJUNEAsset]
)
export const SocotraLTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'LTC1-Chain',
  'HJE8cauhNuocwx5t1U26ducmTTEBcs25AWUCUS2Uwe3wXdKUx',
  new JEVMGasToken(SocotraLTC1Asset),
  BigInt(101009),
  BigInt('17000000000'),
  SocotraAddress,
  ['LTC1'],
  [SocotraJUNEAsset]
)
export const SocotraBCH1Chain: JEVMBlockchain = new JEVMBlockchain(
  'BCH1-Chain',
  '2pCX1xgspH6thhuJ7zCbuKTKEETkJ4tkZi723ybkgQRwfsuW7u',
  new JEVMGasToken(SocotraBCH1Asset),
  BigInt(101013),
  BigInt('3000000000'),
  SocotraAddress,
  ['BCH1'],
  [SocotraJUNEAsset]
)
export const SocotraLINK1Chain: JEVMBlockchain = new JEVMBlockchain(
  'LINK1-Chain',
  'U3o8mtBbGvjrw6vo9FhKAsRJvj2x8EjWzRdDfQXkAm7EqY3by',
  new JEVMGasToken(SocotraLINK1Asset),
  BigInt(101014),
  BigInt('102000000000'),
  SocotraAddress,
  ['LINK1'],
  [SocotraJUNEAsset]
)

export const SocotraPrimarySupernet: PrimarySupernet = new PrimarySupernet(
  '11111111111111111111111111111111LpoYY',
  [
    SocotraPlatformChain,
    SocotraJVMChain,
    SocotraJUNEChain,
    SocotraUSDT1Chain,
    SocotraUSD1Chain,
    SocotraDAI1Chain,
    SocotraEUR1Chain,
    SocotraSGD1Chain,
    SocotraGLD1Chain,
    SocotraMBTC1Chain,
    SocotraDOGE1Chain,
    SocotraLTC1Chain,
    SocotraBCH1Chain,
    SocotraLINK1Chain
  ],
  SocotraPlatformChain,
  SocotraJVMChain,
  SocotraJUNEChain
)

export const SocotraNetwork: MCN = new MCN(
  new MCNAccess(SocotraAddress, SocotraStaticAddresses),
  SocotraNetworkId,
  SocotraHrp,
  SocotraPrimarySupernet
)

export const TestNetwork: MCN = SocotraNetwork
