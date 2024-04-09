import { JNTAsset, JRC20Asset, WrappedAsset, JEVMGasToken } from '../asset'
import { PlatformBlockchain, JVMBlockchain, JEVMBlockchain } from '../chain'
import { PrimarySupernet, StakeConfig, MCN } from './network'

const GenesisNetworkId: number = 2
const GenesisHrp: string = 'socotra'
const GenesisStakeConfig: StakeConfig = new StakeConfig(
  // 80%, 1, 1_000_000, 0.01, 1 day, 365 days
  0.8,
  BigInt(1_000000000),
  BigInt(1_000_000_000000000),
  BigInt(1_0000000),
  BigInt(24 * 3600),
  BigInt(365 * 24 * 3600)
)
const GenesisAddress: string = 'https://api.socotra-test.network:9650'

export const GenesisJUNEAssetId: string = '2RcLCZTsxSnvzeBvtrjRo8PCzLXuecHBoyr8DNp1R8ob8kHkbR'
export const GenesisETH1AssetId: string = 'JeUvxJPXoL3EtVGSPwtyYXVymxGbpcBcaa2Kq7TCB43HsKMAS'
export const GenesisMBTC1AssetId: string = '2pLiXK8pUNqS9DHTKpkiex6g6DRdSfxqJCoZsLM3zq62WtFje3'
export const GenesisDOGE1AssetId: string = '2PR1Dn3w6QUcvVAsb2UTw7F6khcVBjC68SLgyW6MdoqtpaE7ox'
export const GenesisUSDT1AssetId: string = '2TBXB5U2rqPWqebfvjvXJNu27vig6s5mCgkdLYBJzE6jXnrNso'
export const GenesisDAI1AssetId: string = '2vq3K3PxumUV7Uf9PgPoBfr1y8MDjAtMDRex8yTqYzfyrtVJJU'
export const GenesisEUROC1AssetId: string = '2NQFaeBwMcACKqsKqMoLzYmVAHMYeFREfYJq6dtQnsJ5tTyk42'
export const GenesisLTC1AssetId: string = '2REm6DRSgbVyE4dypnzBU9WWUV4zW9VcsTMHiDha7GLV84ZXCy'
export const GenesisXLM1AssetId: string = '25revVW7o2DgkhQPTkbGLNxscS6G9Mj6eTu7PCgKvzw3HM7pJv'
export const GenesisBCH1AssetId: string = '2sC7LPyJguMWdJztKGUa35ABj7KRh1WSNQThLWhdxhJJwGdhv2'
export const GenesisPAXG1AssetId: string = 'VKJNVVGFPWwrpbYtdGanMhTdScZrRYWbgE1JVqzj2YGnU8ewv'
export const GenesisXSGD1AssetId: string = '2BvFezbxtuztCGJbGvz8Dx7woKqMLeZNZ6C6assFMFwGVcCpaH'
export const GenesisETC1AssetId: string = '3sPY2qNyaGop5JNLaSr8GtWHrimtMMkYifACSRVZNKEyZowBg'
export const GenesisR1000AssetId: string = 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbK'
export const GenesisR10AssetId: string = 'tDxKdhyn2b9dNLMdsSv3xEY8ihGf7991XSWxXMzWu1bLtAued'

export const GenesisJUNEAsset: JNTAsset = new JNTAsset(GenesisJUNEAssetId, 'JUNE', 'JUNE', 9, false)
export const GenesisETH1Asset: JNTAsset = new JNTAsset(GenesisETH1AssetId, 'ETH1', 'ETH1', 9, false)
export const GenesisMBTC1Asset: JNTAsset = new JNTAsset(GenesisMBTC1AssetId, 'mBTC1', 'mBTC1', 9, false)
export const GenesisDOGE1Asset: JNTAsset = new JNTAsset(GenesisDOGE1AssetId, 'DOGE1', 'DOGE1', 9, false)
export const GenesisUSDT1Asset: JNTAsset = new JNTAsset(GenesisUSDT1AssetId, 'USDT1', 'USDT1', 9, false)
export const GenesisDAI1Asset: JNTAsset = new JNTAsset(GenesisDAI1AssetId, 'DAI1', 'DAI1', 9, false)
export const GenesisEUROC1Asset: JNTAsset = new JNTAsset(GenesisEUROC1AssetId, 'EUROC1', 'EUROC1', 9, false)
export const GenesisLTC1Asset: JNTAsset = new JNTAsset(GenesisLTC1AssetId, 'LTC1', 'LTC1', 9, false)
export const GenesisXLM1Asset: JNTAsset = new JNTAsset(GenesisXLM1AssetId, 'XLM1', 'XLM1', 9, false)
export const GenesisBCH1Asset: JNTAsset = new JNTAsset(GenesisBCH1AssetId, 'BCH1', 'BCH1', 9, false)
export const GenesisPAXG1Asset: JNTAsset = new JNTAsset(GenesisPAXG1AssetId, 'PAXG1', 'PAXG1', 9, false)
export const GenesisXSGD1Asset: JNTAsset = new JNTAsset(GenesisXSGD1AssetId, 'XSGD1', 'XSGD1', 9, false)
export const GenesisETC1Asset: JNTAsset = new JNTAsset(GenesisETC1AssetId, 'ETC1', 'ETC1', 9, false)
export const GenesisR1000Asset: JNTAsset = new JNTAsset(GenesisR1000AssetId, 'R1000', 'R1000', 9, false)
export const GenesisR10Asset: JNTAsset = new JNTAsset(GenesisR10AssetId, 'R10', 'R10', 9, false)
// JUNE is omitted here because it should be registered by default as the chain asset
const jntAssets: JNTAsset[] = [
  GenesisETH1Asset,
  GenesisMBTC1Asset,
  GenesisDOGE1Asset,
  GenesisUSDT1Asset,
  GenesisDAI1Asset,
  GenesisEUROC1Asset,
  GenesisLTC1Asset,
  GenesisXLM1Asset,
  GenesisBCH1Asset,
  GenesisPAXG1Asset,
  GenesisXSGD1Asset,
  GenesisETC1Asset,
  GenesisR1000Asset,
  GenesisR10Asset
]

export const GenesisPlatformChain: PlatformBlockchain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  GenesisJUNEAsset,
  ['P'],
  jntAssets
)
export const GenesisJVMChain: JVMBlockchain = new JVMBlockchain(
  'JVM-Chain',
  '2RyfCyJ6ieAtwVpUD8a3Yb9fUbGLabQr8RBUEyDeStUAPfjNL6',
  GenesisJUNEAsset,
  ['JVM'],
  jntAssets
)
const jrc20Assets: JRC20Asset[] = [
  new JRC20Asset('0x2d00000000000000000000000000000000000000', 'Ethereum.e', 'ETH.e', 9, GenesisETH1AssetId),
  new JRC20Asset('0x2e00000000000000000000000000000000000000', 'mBitcoin.a', 'mBTC.a', 9, GenesisMBTC1AssetId),
  new JRC20Asset('0x2f00000000000000000000000000000000000000', 'Doge.b', 'DOGE.b', 9, GenesisDOGE1AssetId),
  new JRC20Asset('0x3100000000000000000000000000000000000000', 'Tether USD.e', 'USDT.e', 9, GenesisUSDT1AssetId),
  new JRC20Asset('0x3200000000000000000000000000000000000000', 'Dai.e', 'DAI.e', 9, GenesisDAI1AssetId),
  new JRC20Asset('0x3300000000000000000000000000000000000000', 'Euro Coin.e', 'EUROC.e', 9, GenesisEUROC1AssetId),
  new JRC20Asset('0x3400000000000000000000000000000000000000', 'Litecoin.b', 'LTC.b', 9, GenesisLTC1AssetId),
  new JRC20Asset('0x3500000000000000000000000000000000000000', 'Stellar.x', 'XLM.x', 9, GenesisXLM1AssetId),
  new JRC20Asset('0x3600000000000000000000000000000000000000', 'Bitcoin Cash.b', 'BCH.b', 9, GenesisBCH1AssetId),
  new JRC20Asset('0x3700000000000000000000000000000000000000', 'Pax Gold.e', 'PAXG.e', 9, GenesisPAXG1AssetId),
  new JRC20Asset('0x3a00000000000000000000000000000000000000', 'XSGD.e', 'XSGD.e', 9, GenesisXSGD1AssetId),
  new JRC20Asset('0x3b00000000000000000000000000000000000000', 'Ethereum Classic.x', 'ETC.x', 9, GenesisETC1AssetId),
  new JRC20Asset('0x3c00000000000000000000000000000000000000', 'R1000.a', 'R1000.a', 9, GenesisR1000AssetId),
  new JRC20Asset('0x3d00000000000000000000000000000000000000', 'R10.a', 'R10.a', 9, GenesisR10AssetId)
]
export const GenesisWJUNEAsset: WrappedAsset = new WrappedAsset(
  '0x333e51E9908dcF4Ae79250757ecC3faa21f24554',
  'Wrapped JUNE',
  'wJUNE',
  18
)
export const GenesisJUNEChain: JEVMBlockchain = new JEVMBlockchain(
  'JUNE-Chain',
  'NLp7mU4yqN9xfu3Yezc6Sq66xFx5E1bKaxsBZRBZ7N7FmKhb5',
  new JEVMGasToken(GenesisJUNEAsset),
  BigInt(220001),
  BigInt('48000000000'),
  GenesisAddress,
  ['JUNE'],
  jrc20Assets,
  jrc20Assets,
  GenesisWJUNEAsset
)
export const GenesisETH1Chain: JEVMBlockchain = new JEVMBlockchain(
  'ETH1-Chain',
  'fqxdvHoxBciiVa7wAZjq48HYmFVyQefrDpPyVuPd5GAUHAjEN',
  new JEVMGasToken(GenesisETH1Asset),
  BigInt(220002),
  BigInt('1000000000'),
  GenesisAddress,
  ['ETH1'],
  [GenesisJUNEAsset]
)
export const GenesisMBTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'mBTC1-Chain',
  '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o',
  new JEVMGasToken(GenesisMBTC1Asset),
  BigInt(220003),
  BigInt('18000000000'),
  GenesisAddress,
  ['mBTC1'],
  [GenesisJUNEAsset]
)
export const GenesisDOGE1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DOGE1-Chain',
  'wb8QNS3zrwd94Mc1o7L2mqhL8CQiRAvkVLTXFkdnbX1LaESpn',
  new JEVMGasToken(GenesisDOGE1Asset),
  BigInt(220004),
  BigInt('5952000000000'),
  GenesisAddress,
  ['DOGE1'],
  [GenesisJUNEAsset]
)
export const GenesisUSDT1Chain: JEVMBlockchain = new JEVMBlockchain(
  'USDT1-Chain',
  'xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM',
  new JEVMGasToken(GenesisUSDT1Asset),
  BigInt(220006),
  BigInt('476000000000'),
  GenesisAddress,
  ['USDT1'],
  [GenesisJUNEAsset]
)
export const GenesisDAI1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DAI1-Chain',
  'XgN1Q8XeEuj9SU5UtM2LtNWsufgrz6amVs8BwGcJZM7ZuarNq',
  new JEVMGasToken(GenesisDAI1Asset),
  BigInt(220007),
  BigInt('476000000000'),
  GenesisAddress,
  ['DAI1'],
  [GenesisJUNEAsset]
)
export const GenesisEUROC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'EUROC1-Chain',
  '2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82',
  new JEVMGasToken(GenesisEUROC1Asset),
  BigInt(220008),
  BigInt('476000000000'),
  GenesisAddress,
  ['EUROC1'],
  [GenesisJUNEAsset]
)
export const GenesisLTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'LTC1-Chain',
  'fawNQXm5Q8AzyvuvASN1NfvYuqqmvr55WQeD8ZibJz6Q12WP4',
  new JEVMGasToken(GenesisLTC1Asset),
  BigInt(220009),
  BigInt('5000000000'),
  GenesisAddress,
  ['LTC1'],
  [GenesisJUNEAsset]
)
export const GenesisXLM1Chain: JEVMBlockchain = new JEVMBlockchain(
  'XLM1-Chain',
  '2deaJGmohHKGJNeeCc76AdBpjxYgGQvqg7egYFnrUTm8PLKihd',
  new JEVMGasToken(GenesisXLM1Asset),
  BigInt(220010),
  BigInt('4762000000000'),
  GenesisAddress,
  ['XLM1'],
  [GenesisJUNEAsset]
)
export const GenesisBCH1Chain: JEVMBlockchain = new JEVMBlockchain(
  'BCH1-Chain',
  '29n3FwMYBxUGtH97BeheVfr2HTxmK2u8XvCuWyaHSKMmMeisVv',
  new JEVMGasToken(GenesisBCH1Asset),
  BigInt(220011),
  BigInt('4000000000'),
  GenesisAddress,
  ['BCH1'],
  [GenesisJUNEAsset]
)
export const GenesisPAXG1Chain: JEVMBlockchain = new JEVMBlockchain(
  'PAXG1-Chain',
  'SRPjwo4SgDKFAonPLy9mmYzVRNAv5o8nUJ1GyMJ9S3ojr87bW',
  new JEVMGasToken(GenesisPAXG1Asset),
  BigInt(220012),
  BigInt('1000000000'),
  GenesisAddress,
  ['PAXG1'],
  [GenesisJUNEAsset]
)
export const GenesisXSGD1Chain: JEVMBlockchain = new JEVMBlockchain(
  'XSGD1-Chain',
  '2u5LruuaCVuJ8qbasjZNh4ZKMhX96hFT3jQZvnvSCtY9faVViN',
  new JEVMGasToken(GenesisXSGD1Asset),
  BigInt(220015),
  BigInt('627000000000'),
  GenesisAddress,
  ['XSGD1'],
  [GenesisJUNEAsset]
)
export const GenesisETC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'ETC1-Chain',
  '2T2erzcpLjaeiYqFX7HWG6EenkR3vpk6pdY1HLEZmK4P9UJ8xS',
  new JEVMGasToken(GenesisETC1Asset),
  BigInt(220016),
  BigInt('24000000000'),
  GenesisAddress,
  ['ETC1'],
  [GenesisJUNEAsset]
)
export const GenesisR1000Chain: JEVMBlockchain = new JEVMBlockchain(
  'R1000-Chain',
  '2eWMraHV8fMZmCGcHTcS8aurRWXcyrerWYooJZm6PE5ayLhYnh',
  new JEVMGasToken(GenesisR1000Asset),
  BigInt(220017),
  BigInt('476000000000'),
  GenesisAddress,
  ['R1000'],
  [GenesisJUNEAsset]
)
export const GenesisR10Chain: JEVMBlockchain = new JEVMBlockchain(
  'R10-Chain',
  '4KZj9sbft2PT2yZCoS7ntSxhnSsw3Jjwv8xDmD2thmgLmQ8W3',
  new JEVMGasToken(GenesisR10Asset),
  BigInt(220018),
  BigInt('476000000000'),
  GenesisAddress,
  ['R10'],
  [GenesisJUNEAsset]
)

export const GenesisPrimarySupernet: PrimarySupernet = new PrimarySupernet(
  '11111111111111111111111111111111LpoYY',
  [
    GenesisPlatformChain,
    GenesisJVMChain,
    GenesisJUNEChain,
    GenesisETH1Chain,
    GenesisMBTC1Chain,
    GenesisDOGE1Chain,
    GenesisUSDT1Chain,
    GenesisDAI1Chain,
    GenesisEUROC1Chain,
    GenesisLTC1Chain,
    GenesisXLM1Chain,
    GenesisBCH1Chain,
    GenesisPAXG1Chain,
    GenesisXSGD1Chain,
    GenesisETC1Chain,
    GenesisR1000Chain,
    GenesisR10Chain
  ],
  GenesisPlatformChain,
  GenesisJVMChain,
  GenesisJUNEChain
)

export const GenesisNetwork: MCN = new MCN(
  GenesisAddress,
  GenesisNetworkId,
  GenesisHrp,
  GenesisStakeConfig,
  GenesisPrimarySupernet
)
