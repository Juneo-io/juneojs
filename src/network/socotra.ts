import { JNTAsset, JRC20Asset, WrappedAsset, JEVMGasToken } from '../asset'
import { PlatformBlockchain, JVMBlockchain, JEVMBlockchain } from '../chain'
import { PrimarySupernet, StakeConfig, MCN } from './network'

const SocotraNetworkId: number = 2
const SocotraHrp: string = 'socotra'
const SocotraStakeConfig: StakeConfig = new StakeConfig(
  // 80%, 1, 1_000_000, 0.01, 1 day, 365 days
  0.8,
  BigInt(1_000000000),
  BigInt(1_000_000_000000000),
  BigInt(1_0000000),
  BigInt(24 * 3600),
  BigInt(365 * 24 * 3600)
)
const SocotraAddress: string = 'https://api.socotra-test.network:9650'

export const SocotraJUNEAssetId: string = '2RcLCZTsxSnvzeBvtrjRo8PCzLXuecHBoyr8DNp1R8ob8kHkbR'
export const SocotraETH1AssetId: string = 'JeUvxJPXoL3EtVGSPwtyYXVymxGbpcBcaa2Kq7TCB43HsKMAS'
export const SocotraMBTC1AssetId: string = '2pLiXK8pUNqS9DHTKpkiex6g6DRdSfxqJCoZsLM3zq62WtFje3'
export const SocotraDOGE1AssetId: string = '2PR1Dn3w6QUcvVAsb2UTw7F6khcVBjC68SLgyW6MdoqtpaE7ox'
export const SocotraUSDT1AssetId: string = '2TBXB5U2rqPWqebfvjvXJNu27vig6s5mCgkdLYBJzE6jXnrNso'
export const SocotraDAI1AssetId: string = '2vq3K3PxumUV7Uf9PgPoBfr1y8MDjAtMDRex8yTqYzfyrtVJJU'
export const SocotraEUROC1AssetId: string = '2NQFaeBwMcACKqsKqMoLzYmVAHMYeFREfYJq6dtQnsJ5tTyk42'
export const SocotraLTC1AssetId: string = '2REm6DRSgbVyE4dypnzBU9WWUV4zW9VcsTMHiDha7GLV84ZXCy'
export const SocotraXLM1AssetId: string = '25revVW7o2DgkhQPTkbGLNxscS6G9Mj6eTu7PCgKvzw3HM7pJv'
export const SocotraBCH1AssetId: string = '2sC7LPyJguMWdJztKGUa35ABj7KRh1WSNQThLWhdxhJJwGdhv2'
export const SocotraPAXG1AssetId: string = 'VKJNVVGFPWwrpbYtdGanMhTdScZrRYWbgE1JVqzj2YGnU8ewv'
export const SocotraXSGD1AssetId: string = '2BvFezbxtuztCGJbGvz8Dx7woKqMLeZNZ6C6assFMFwGVcCpaH'
export const SocotraETC1AssetId: string = '3sPY2qNyaGop5JNLaSr8GtWHrimtMMkYifACSRVZNKEyZowBg'
export const SocotraR1000AssetId: string = 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbK'
export const SocotraR10AssetId: string = 'tDxKdhyn2b9dNLMdsSv3xEY8ihGf7991XSWxXMzWu1bLtAued'

export const SocotraJUNEAsset: JNTAsset = new JNTAsset(SocotraJUNEAssetId, 'JUNE', 'JUNE', 9, false)
export const SocotraETH1Asset: JNTAsset = new JNTAsset(SocotraETH1AssetId, 'ETH1', 'ETH1', 9, false)
export const SocotraMBTC1Asset: JNTAsset = new JNTAsset(SocotraMBTC1AssetId, 'mBTC1', 'mBTC1', 9, false)
export const SocotraDOGE1Asset: JNTAsset = new JNTAsset(SocotraDOGE1AssetId, 'DOGE1', 'DOGE1', 9, false)
export const SocotraUSDT1Asset: JNTAsset = new JNTAsset(SocotraUSDT1AssetId, 'USDT1', 'USDT1', 9, false)
export const SocotraDAI1Asset: JNTAsset = new JNTAsset(SocotraDAI1AssetId, 'DAI1', 'DAI1', 9, false)
export const SocotraEUROC1Asset: JNTAsset = new JNTAsset(SocotraEUROC1AssetId, 'EUROC1', 'EUROC1', 9, false)
export const SocotraLTC1Asset: JNTAsset = new JNTAsset(SocotraLTC1AssetId, 'LTC1', 'LTC1', 9, false)
export const SocotraXLM1Asset: JNTAsset = new JNTAsset(SocotraXLM1AssetId, 'XLM1', 'XLM1', 9, false)
export const SocotraBCH1Asset: JNTAsset = new JNTAsset(SocotraBCH1AssetId, 'BCH1', 'BCH1', 9, false)
export const SocotraPAXG1Asset: JNTAsset = new JNTAsset(SocotraPAXG1AssetId, 'PAXG1', 'PAXG1', 9, false)
export const SocotraXSGD1Asset: JNTAsset = new JNTAsset(SocotraXSGD1AssetId, 'XSGD1', 'XSGD1', 9, false)
export const SocotraETC1Asset: JNTAsset = new JNTAsset(SocotraETC1AssetId, 'ETC1', 'ETC1', 9, false)
export const SocotraR1000Asset: JNTAsset = new JNTAsset(SocotraR1000AssetId, 'R1000', 'R1000', 9, false)
export const SocotraR10Asset: JNTAsset = new JNTAsset(SocotraR10AssetId, 'R10', 'R10', 9, false)
// JUNE is omitted here because it should be registered by default as the chain asset
const jntAssets: JNTAsset[] = [
  SocotraETH1Asset,
  SocotraMBTC1Asset,
  SocotraDOGE1Asset,
  SocotraUSDT1Asset,
  SocotraDAI1Asset,
  SocotraEUROC1Asset,
  SocotraLTC1Asset,
  SocotraXLM1Asset,
  SocotraBCH1Asset,
  SocotraPAXG1Asset,
  SocotraXSGD1Asset,
  SocotraETC1Asset,
  SocotraR1000Asset,
  SocotraR10Asset
]

export const SocotraPlatformChain: PlatformBlockchain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  SocotraJUNEAsset,
  ['P'],
  jntAssets
)
export const SocotraJVMChain: JVMBlockchain = new JVMBlockchain(
  'JVM-Chain',
  '2RyfCyJ6ieAtwVpUD8a3Yb9fUbGLabQr8RBUEyDeStUAPfjNL6',
  SocotraJUNEAsset,
  ['JVM'],
  jntAssets
)
const jrc20Assets: JRC20Asset[] = [
  new JRC20Asset('0x2d00000000000000000000000000000000000000', 'Ethereum.e', 'ETH.e', 9, SocotraETH1AssetId),
  new JRC20Asset('0x2e00000000000000000000000000000000000000', 'mBitcoin.a', 'mBTC.a', 9, SocotraMBTC1AssetId),
  new JRC20Asset('0x2f00000000000000000000000000000000000000', 'Doge.b', 'DOGE.b', 9, SocotraDOGE1AssetId),
  new JRC20Asset('0x3100000000000000000000000000000000000000', 'Tether USD.e', 'USDT.e', 9, SocotraUSDT1AssetId),
  new JRC20Asset('0x3200000000000000000000000000000000000000', 'Dai.e', 'DAI.e', 9, SocotraDAI1AssetId),
  new JRC20Asset('0x3300000000000000000000000000000000000000', 'Euro Coin.e', 'EUROC.e', 9, SocotraEUROC1AssetId),
  new JRC20Asset('0x3400000000000000000000000000000000000000', 'Litecoin.b', 'LTC.b', 9, SocotraLTC1AssetId),
  new JRC20Asset('0x3500000000000000000000000000000000000000', 'Stellar.x', 'XLM.x', 9, SocotraXLM1AssetId),
  new JRC20Asset('0x3600000000000000000000000000000000000000', 'Bitcoin Cash.b', 'BCH.b', 9, SocotraBCH1AssetId),
  new JRC20Asset('0x3700000000000000000000000000000000000000', 'Pax Gold.e', 'PAXG.e', 9, SocotraPAXG1AssetId),
  new JRC20Asset('0x3a00000000000000000000000000000000000000', 'XSGD.e', 'XSGD.e', 9, SocotraXSGD1AssetId),
  new JRC20Asset('0x3b00000000000000000000000000000000000000', 'Ethereum Classic.x', 'ETC.x', 9, SocotraETC1AssetId),
  new JRC20Asset('0x3c00000000000000000000000000000000000000', 'R1000.a', 'R1000.a', 9, SocotraR1000AssetId),
  new JRC20Asset('0x3d00000000000000000000000000000000000000', 'R10.a', 'R10.a', 9, SocotraR10AssetId)
]
export const SocotraWJUNEAsset: WrappedAsset = new WrappedAsset(
  '0x333e51E9908dcF4Ae79250757ecC3faa21f24554',
  'Wrapped JUNE',
  'wJUNE',
  18
)
export const SocotraJUNEChain: JEVMBlockchain = new JEVMBlockchain(
  'JUNE-Chain',
  'NLp7mU4yqN9xfu3Yezc6Sq66xFx5E1bKaxsBZRBZ7N7FmKhb5',
  new JEVMGasToken(SocotraJUNEAsset),
  BigInt(220001),
  BigInt('48000000000'),
  SocotraAddress,
  ['JUNE'],
  jrc20Assets,
  jrc20Assets,
  SocotraWJUNEAsset
)
export const SocotraETH1Chain: JEVMBlockchain = new JEVMBlockchain(
  'ETH1-Chain',
  'fqxdvHoxBciiVa7wAZjq48HYmFVyQefrDpPyVuPd5GAUHAjEN',
  new JEVMGasToken(SocotraETH1Asset),
  BigInt(220002),
  BigInt('1000000000'),
  SocotraAddress,
  ['ETH1'],
  [SocotraJUNEAsset]
)
export const SocotraMBTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'mBTC1-Chain',
  '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o',
  new JEVMGasToken(SocotraMBTC1Asset),
  BigInt(220003),
  BigInt('18000000000'),
  SocotraAddress,
  ['mBTC1'],
  [SocotraJUNEAsset]
)
export const SocotraDOGE1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DOGE1-Chain',
  'wb8QNS3zrwd94Mc1o7L2mqhL8CQiRAvkVLTXFkdnbX1LaESpn',
  new JEVMGasToken(SocotraDOGE1Asset),
  BigInt(220004),
  BigInt('5952000000000'),
  SocotraAddress,
  ['DOGE1'],
  [SocotraJUNEAsset]
)
export const SocotraUSDT1Chain: JEVMBlockchain = new JEVMBlockchain(
  'USDT1-Chain',
  'xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM',
  new JEVMGasToken(SocotraUSDT1Asset),
  BigInt(220006),
  BigInt('476000000000'),
  SocotraAddress,
  ['USDT1'],
  [SocotraJUNEAsset]
)
export const SocotraDAI1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DAI1-Chain',
  'XgN1Q8XeEuj9SU5UtM2LtNWsufgrz6amVs8BwGcJZM7ZuarNq',
  new JEVMGasToken(SocotraDAI1Asset),
  BigInt(220007),
  BigInt('476000000000'),
  SocotraAddress,
  ['DAI1'],
  [SocotraJUNEAsset]
)
export const SocotraEUROC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'EUROC1-Chain',
  '2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82',
  new JEVMGasToken(SocotraEUROC1Asset),
  BigInt(220008),
  BigInt('476000000000'),
  SocotraAddress,
  ['EUROC1'],
  [SocotraJUNEAsset]
)
export const SocotraLTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'LTC1-Chain',
  'fawNQXm5Q8AzyvuvASN1NfvYuqqmvr55WQeD8ZibJz6Q12WP4',
  new JEVMGasToken(SocotraLTC1Asset),
  BigInt(220009),
  BigInt('5000000000'),
  SocotraAddress,
  ['LTC1'],
  [SocotraJUNEAsset]
)
export const SocotraXLM1Chain: JEVMBlockchain = new JEVMBlockchain(
  'XLM1-Chain',
  '2deaJGmohHKGJNeeCc76AdBpjxYgGQvqg7egYFnrUTm8PLKihd',
  new JEVMGasToken(SocotraXLM1Asset),
  BigInt(220010),
  BigInt('4762000000000'),
  SocotraAddress,
  ['XLM1'],
  [SocotraJUNEAsset]
)
export const SocotraBCH1Chain: JEVMBlockchain = new JEVMBlockchain(
  'BCH1-Chain',
  '29n3FwMYBxUGtH97BeheVfr2HTxmK2u8XvCuWyaHSKMmMeisVv',
  new JEVMGasToken(SocotraBCH1Asset),
  BigInt(220011),
  BigInt('4000000000'),
  SocotraAddress,
  ['BCH1'],
  [SocotraJUNEAsset]
)
export const SocotraPAXG1Chain: JEVMBlockchain = new JEVMBlockchain(
  'PAXG1-Chain',
  'SRPjwo4SgDKFAonPLy9mmYzVRNAv5o8nUJ1GyMJ9S3ojr87bW',
  new JEVMGasToken(SocotraPAXG1Asset),
  BigInt(220012),
  BigInt('1000000000'),
  SocotraAddress,
  ['PAXG1'],
  [SocotraJUNEAsset]
)
export const SocotraXSGD1Chain: JEVMBlockchain = new JEVMBlockchain(
  'XSGD1-Chain',
  '2u5LruuaCVuJ8qbasjZNh4ZKMhX96hFT3jQZvnvSCtY9faVViN',
  new JEVMGasToken(SocotraXSGD1Asset),
  BigInt(220015),
  BigInt('627000000000'),
  SocotraAddress,
  ['XSGD1'],
  [SocotraJUNEAsset]
)
export const SocotraETC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'ETC1-Chain',
  '2T2erzcpLjaeiYqFX7HWG6EenkR3vpk6pdY1HLEZmK4P9UJ8xS',
  new JEVMGasToken(SocotraETC1Asset),
  BigInt(220016),
  BigInt('24000000000'),
  SocotraAddress,
  ['ETC1'],
  [SocotraJUNEAsset]
)
export const SocotraR1000Chain: JEVMBlockchain = new JEVMBlockchain(
  'R1000-Chain',
  '2eWMraHV8fMZmCGcHTcS8aurRWXcyrerWYooJZm6PE5ayLhYnh',
  new JEVMGasToken(SocotraR1000Asset),
  BigInt(220017),
  BigInt('476000000000'),
  SocotraAddress,
  ['R1000'],
  [SocotraJUNEAsset]
)
export const SocotraR10Chain: JEVMBlockchain = new JEVMBlockchain(
  'R10-Chain',
  '4KZj9sbft2PT2yZCoS7ntSxhnSsw3Jjwv8xDmD2thmgLmQ8W3',
  new JEVMGasToken(SocotraR10Asset),
  BigInt(220018),
  BigInt('476000000000'),
  SocotraAddress,
  ['R10'],
  [SocotraJUNEAsset]
)

export const SocotraPrimarySupernet: PrimarySupernet = new PrimarySupernet(
  '11111111111111111111111111111111LpoYY',
  [
    SocotraPlatformChain,
    SocotraJVMChain,
    SocotraJUNEChain,
    SocotraETH1Chain,
    SocotraMBTC1Chain,
    SocotraDOGE1Chain,
    SocotraUSDT1Chain,
    SocotraDAI1Chain,
    SocotraEUROC1Chain,
    SocotraLTC1Chain,
    SocotraXLM1Chain,
    SocotraBCH1Chain,
    SocotraPAXG1Chain,
    SocotraXSGD1Chain,
    SocotraETC1Chain,
    SocotraR1000Chain,
    SocotraR10Chain
  ],
  SocotraPlatformChain,
  SocotraJVMChain,
  SocotraJUNEChain
)

export const SocotraNetwork: MCN = new MCN(
  SocotraAddress,
  SocotraNetworkId,
  SocotraHrp,
  SocotraStakeConfig,
  SocotraPrimarySupernet
)
