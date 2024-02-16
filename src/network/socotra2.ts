import { JNTAsset, JRC20Asset, JEVMGasToken, WrappedAsset } from '../asset'
import { PlatformBlockchain, JVMBlockchain, JEVMBlockchain } from '../chain'
import { PrimarySupernet, StakeConfig, MCN } from './network'

const Socotra2NetworkId: number = 46
const Socotra2Hrp: string = 'socotra'
const Socotra2StakeConfig: StakeConfig = new StakeConfig(
  // 80%, 1, 1_000_000, 0.1, 14 day, 365 days
  0.8,
  BigInt(1_000000000),
  BigInt(1_000_000_000000000),
  BigInt(1_00000000),
  BigInt(14 * 24 * 3600),
  BigInt(365 * 24 * 3600)
)
const Socotra2Address: string = 'https://api.socotra-testnet.network'

export const Socotra2JUNEAssetId: string = 'HviVNFzh2nCqyi7bQxw6pt5fUPjZC8r3DCDrt7mRmScZS2zp5'
export const Socotra2USDT1AssetId: string = 'Ld5aCozSMQ1hC5jdXS3mhGNgoYVjVDe8zPTtPSbs4xS5JQSfJ'
export const Socotra2USD1AssetId: string = '2A1NW7YEoPSaKGy2LWUnbqiw2nFUTUt8rk9wzTzqZaqG2w7aB4'
export const Socotra2DAI1AssetId: string = 'jB86KaCskBuRjqA6cUeyy2GtWpdF2i9MigV6yuGekojmTbQTC'
export const Socotra2EUR1AssetId: string = '2CkzBNwEKvreEwYp2froWJePpXfruZu6iemJVfNqUAtVjJDRkp'
export const Socotra2SGD1AssetId: string = '2Bi6ovdELbjXhSxs9fQTMPWUHcCbvJJZV4pHLkwcQyD7dDrqLG'
export const Socotra2GLD1AssetId: string = 'HNihfvex33EDsuHuQddQpBpwUtkotLwnt54aj7GkGrxY9mLGz'
export const Socotra2MBTC1AssetId: string = '2oWo7iw26bbY2bAt9pFfbFpTCnFVVY2CePDHM4tjTeV7e4FPoQ'
export const Socotra2DOGE1AssetId: string = '47Y4SGbEzTCQ1DCzBaSnE34qTuQH7MBV99FsFHptodbQEn32u'
export const Socotra2LTC1AssetId: string = '27LfLHoSPYdspLG8QwMjvRby2XfLKS8eCZt2mTnJXM65fAduVv'

export const Socotra2JUNEAsset: JNTAsset = new JNTAsset(Socotra2JUNEAssetId, 'JUNE', 'JUNE', 9, false)
export const Socotra2USDT1Asset: JNTAsset = new JNTAsset(Socotra2USDT1AssetId, 'USDT1', 'USDT1', 9, false)
export const Socotra2USD1Asset: JNTAsset = new JNTAsset(Socotra2USD1AssetId, 'USD1', 'USD1', 9, false)
export const Socotra2DAI1Asset: JNTAsset = new JNTAsset(Socotra2DAI1AssetId, 'DAI1', 'DAI1', 9, false)
export const Socotra2EUR1Asset: JNTAsset = new JNTAsset(Socotra2EUR1AssetId, 'EUR1', 'EUR1', 9, false)
export const Socotra2SGD1Asset: JNTAsset = new JNTAsset(Socotra2SGD1AssetId, 'SGD1', 'SGD1', 9, false)
export const Socotra2GLD1Asset: JNTAsset = new JNTAsset(Socotra2GLD1AssetId, 'GLD1', 'GLD1', 9, false)
export const Socotra2MBTC1Asset: JNTAsset = new JNTAsset(Socotra2MBTC1AssetId, 'mBTC1', 'mBTC1', 9, false)
export const Socotra2DOGE1Asset: JNTAsset = new JNTAsset(Socotra2DOGE1AssetId, 'DOGE1', 'DOGE1', 9, false)
export const Socotra2LTC1Asset: JNTAsset = new JNTAsset(Socotra2LTC1AssetId, 'LTC1', 'LTC1', 9, false)
// JUNE is omitted here because it should be registered by default as the chain asset
const jntAssets: JNTAsset[] = [
  Socotra2USDT1Asset,
  Socotra2USD1Asset,
  Socotra2DAI1Asset,
  Socotra2EUR1Asset,
  Socotra2SGD1Asset,
  Socotra2GLD1Asset,
  Socotra2MBTC1Asset,
  Socotra2DOGE1Asset,
  Socotra2LTC1Asset
]

export const Socotra2PlatformChain: PlatformBlockchain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  Socotra2JUNEAsset,
  ['P'],
  jntAssets
)
export const Socotra2JVMChain: JVMBlockchain = new JVMBlockchain(
  'JVM-Chain',
  '2G9wwv8Zmh5CVHLDMbp74rFN6eokSaBHpdn9ysSaCANP1oJ1TY',
  Socotra2JUNEAsset,
  ['JVM'],
  jntAssets
)
const jrc20Assets: JRC20Asset[] = [
  new JRC20Asset('0x2d00000000000000000000000000000000000000', 'USDT.e', 'USDT.e', 9, Socotra2USDT1AssetId),
  new JRC20Asset('0x2e00000000000000000000000000000000000000', 'USD1.e', 'USD1.e', 9, Socotra2USD1AssetId),
  new JRC20Asset('0x2f00000000000000000000000000000000000000', 'DAI.e', 'DAI.e', 9, Socotra2DAI1AssetId),
  new JRC20Asset('0x3000000000000000000000000000000000000000', 'EUR1.e', 'EUR1.e', 9, Socotra2EUR1AssetId),
  new JRC20Asset('0x3100000000000000000000000000000000000000', 'SGD1.e', 'SGD1.e', 9, Socotra2SGD1AssetId),
  new JRC20Asset('0x3200000000000000000000000000000000000000', 'GLD1.e', 'GLD1.e', 9, Socotra2GLD1AssetId),
  new JRC20Asset('0x3300000000000000000000000000000000000000', 'mBTC.a', 'mBTC.a', 9, Socotra2MBTC1AssetId),
  new JRC20Asset('0x3400000000000000000000000000000000000000', 'DOGE.b', 'DOGE.b', 9, Socotra2DOGE1AssetId),
  new JRC20Asset('0x3500000000000000000000000000000000000000', 'LTC.b', 'LTC.b', 9, Socotra2LTC1AssetId)
]
export const Socotra2WJUNEAsset: WrappedAsset = new WrappedAsset(
  '0xDce22197228e8Ae74bC9D07539A29Ea9F6DE372a',
  'Wrapped JUNE',
  'wJUNE',
  18
)
export const Socotra2JUNEChain: JEVMBlockchain = new JEVMBlockchain(
  'JUNE-Chain',
  'ieJEHSN4hCt74dafPvZSwoe9Fa12fmF4Ze496V63VM2DgKtRJ',
  new JEVMGasToken(Socotra2JUNEAsset),
  BigInt(101003),
  BigInt('48000000000'),
  Socotra2Address,
  ['JUNE'],
  jrc20Assets,
  jrc20Assets,
  Socotra2WJUNEAsset
)
export const Socotra2USDT1Chain: JEVMBlockchain = new JEVMBlockchain(
  'USDT1-Chain',
  'Hy9EYN9z6LdGncHuexyxkD8PxAvtCsPpmtJCiE7eTSgWR9FTV',
  new JEVMGasToken(Socotra2USDT1Asset),
  BigInt(101005),
  BigInt('1000000000'),
  Socotra2Address,
  ['USDT1'],
  [Socotra2JUNEAsset]
)
export const Socotra2USD1Chain: JEVMBlockchain = new JEVMBlockchain(
  'USD1-Chain',
  '2pXUvyWNG4WDB4jrVEBSDDrdLdHdEbN1inANqtu7nRMEVWqee1',
  new JEVMGasToken(Socotra2USD1Asset),
  BigInt(101006),
  BigInt('1000000000'),
  Socotra2Address,
  ['USD1'],
  [Socotra2JUNEAsset]
)
export const Socotra2DAI1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DAI1-Chain',
  'VWWs6GnMuePFQY2jLg5Pan2e4cuFN5p8JxfsnFTMBSrXjiHBt',
  new JEVMGasToken(Socotra2DAI1Asset),
  BigInt(101004),
  BigInt('1000000000'),
  Socotra2Address,
  ['DAI1'],
  [Socotra2JUNEAsset]
)
export const Socotra2EUR1Chain: JEVMBlockchain = new JEVMBlockchain(
  'EUR1-Chain',
  '2aro5zMSQcJCV8hkvCqonZzjdFrauUaUMsxF9qAFt434yVYkbo',
  new JEVMGasToken(Socotra2EUR1Asset),
  BigInt(101011),
  BigInt('1000000000'),
  Socotra2Address,
  ['EUR1'],
  [Socotra2JUNEAsset]
)
export const Socotra2SGD1Chain: JEVMBlockchain = new JEVMBlockchain(
  'SGD1-Chain',
  '2aju471wKZPBAfXioCcmf9Ly7R7iY4WTbD6TF23o9WrYLDZiD6',
  new JEVMGasToken(Socotra2SGD1Asset),
  BigInt(101012),
  BigInt('1000000000'),
  Socotra2Address,
  ['SGD1'],
  [Socotra2JUNEAsset]
)
export const Socotra2GLD1Chain: JEVMBlockchain = new JEVMBlockchain(
  'GLD1-Chain',
  'BKSXRT1HnDeDuCasgkPgHoF8AreCYtodVWMJgTPFEvrF15juZ',
  new JEVMGasToken(Socotra2GLD1Asset),
  BigInt(101008),
  BigInt('1000000000'),
  Socotra2Address,
  ['GLD1'],
  [Socotra2JUNEAsset]
)
export const Socotra2MBTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'mBTC1-Chain',
  'RK6Ea5u9CrS2nBiaJ52NjgpWU3syCky2HvcBh4omYiZ1iVHcE',
  new JEVMGasToken(Socotra2MBTC1Asset),
  BigInt(101007),
  BigInt('1000000000'),
  Socotra2Address,
  ['mBTC1'],
  [Socotra2JUNEAsset]
)
export const Socotra2DOGE1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DOGE1-Chain',
  'N6uGmQbSBQrheqY1JHjvVi7MZLG2UEV92xGx1fEXv6DutzchB',
  new JEVMGasToken(Socotra2DOGE1Asset),
  BigInt(101010),
  BigInt('1000000000'),
  Socotra2Address,
  ['DOGE1'],
  [Socotra2JUNEAsset]
)
export const Socotra2LTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'LTC1-Chain',
  '28guorC5RQ46JmsTuzdWa2FXaST9CAvHfyVtZZvyN2DkZpBUZP',
  new JEVMGasToken(Socotra2LTC1Asset),
  BigInt(101009),
  BigInt('1000000000'),
  Socotra2Address,
  ['LTC1'],
  [Socotra2JUNEAsset]
)

export const Socotra2PrimarySupernet: PrimarySupernet = new PrimarySupernet(
  '11111111111111111111111111111111LpoYY',
  [
    Socotra2PlatformChain,
    Socotra2JVMChain,
    Socotra2JUNEChain,
    Socotra2USDT1Chain,
    Socotra2USD1Chain,
    Socotra2DAI1Chain,
    Socotra2EUR1Chain,
    Socotra2SGD1Chain,
    Socotra2GLD1Chain,
    Socotra2MBTC1Chain,
    Socotra2DOGE1Chain,
    Socotra2LTC1Chain
  ],
  Socotra2PlatformChain,
  Socotra2JVMChain,
  Socotra2JUNEChain
)

export const Socotra2Network: MCN = new MCN(
  Socotra2Address,
  Socotra2NetworkId,
  Socotra2Hrp,
  Socotra2StakeConfig,
  Socotra2PrimarySupernet
)
