import { JEVMGasToken, JNTAsset, JRC20Asset, WrappedAsset } from '../asset'
import { JEVMBlockchain, JVMBlockchain, PlatformBlockchain, RewardConfig, StakeConfig } from '../chain'
import { MCN, PrimarySupernet } from './network'

const BluebyteNetworkName = 'Blue Byte1 Supernet'
const BluebyteNetworkId = 48
const BluebyteHrp = 'bluebyte'
const BluebyteStakeConfig = new StakeConfig(
  0.8, // 80%
  BigInt(20_000000000), // 20 BBY1
  BigInt(30_000_000000000), // 30_000 BBY1
  BigInt(1_000000), // 0.1 BBY1
  5_0000, // 5%
  5_0000, // 5%
  BigInt(14 * 86_400), // 14 days
  BigInt(365 * 86_400) // 365 days
)
const BluebyteRewardConfig = new RewardConfig(
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
const BluebyteAddress = 'https://rpc.bluebyte1-mainnet.network'

//
// ----- JNT Assets -----
//
export const BluebyteBBY1Asset = new JNTAsset(
  'Y3D3JzBtTRQQWFvgixNZNZ3EJ4TueDhz4Vhzt4Srfv2PWzA4c',
  'Blue Byte1',
  'BBY1',
  9,
  false
)
export const BluebytePYUSD1Asset = new JNTAsset(
  '2tZD8KnDoetXiCJTU6xvx2CvqiShkvYw7e1kMZjwz6asmu8rPs',
  'PayPal USD',
  'PYUSD1',
  9,
  false
)
export const BluebyteLCX1Asset = new JNTAsset(
  'ytRcYav3jag9edNmv5mXjGBHtXUpcSG8mMZ47VvU9sXbnsV3D',
  'LCX',
  'LCX1',
  9,
  false
)
export const BluebyteNEXO1Asset = new JNTAsset(
  'Z5oZxb4WrcjrN2xXTDe5oqNQWJyoQno7kZy7i8Vc2V5GD86dq',
  'Nexo',
  'NEXO1',
  9,
  false
)
export const BluebyteBORG1Asset = new JNTAsset(
  '2K7vqY67VbuTRYQEAtjjVUWxKMPf41cucWmwYsGvD7KSaVsTjk',
  'SwissBorg',
  'BORG1',
  9,
  false
)
export const BluebyteETC1Asset = new JNTAsset(
  '9KeJRHoX5mKuxcqX4kBsiYtFNDGxsbZypy2CXc2WMAAApEYkZ',
  'Ethereum Classic',
  'ETC1',
  9,
  false
)
export const BluebyteWSTETH1Asset = new JNTAsset(
  '2ek4B7JERvTa6Jg6ZEtBsdwsR5z9hSfTt8BVKbJkMaDe1iFCTL',
  'wstETH1',
  'wstETH1',
  9,
  false
)
export const BluebyteXLM1Asset = new JNTAsset(
  '2heXKMixq4FqTJQFXZnRHfzTxBv3E4LVDxdV5xsC6QWwFCTJNf',
  'Stellar',
  'XLM1',
  9,
  false
)
export const BluebyteBNT1Asset = new JNTAsset(
  '3Rz3GPmkreZckvz793KCZ8ypzUPXfWTW6aSoCWdGWAnEEwDbt',
  'Bancor',
  'BNT1',
  9,
  false
)
export const BluebyteBAT1Asset = new JNTAsset(
  '2PkV8iFxY6AajJgXnHKLfWVUYuP9CWTXB4H4YuHwstVYNQ5PZq',
  'Basic Attention Token',
  'BAT1',
  9,
  false
)
export const BluebyteC98Asset = new JNTAsset(
  '2mMoHTWjGxMUP7n1Jzw1Rt29usvBkYmwT4xdMqYuTYwb6kVnXf',
  'Coin98',
  'C98',
  9,
  false
)
export const BluebytePYTH1Asset = new JNTAsset(
  '2K9CqrFdVcM6WSowtisUuGA6QcTroBAQyi3U9Mu246pcWucEF3',
  'Pyth Network',
  'PYTH1',
  9,
  false
)
// BBY1 is omitted here because it should be registered by default as the chain asset
const jntAssets: JNTAsset[] = [
  BluebytePYUSD1Asset,
  BluebyteLCX1Asset,
  BluebyteNEXO1Asset,
  BluebyteBORG1Asset,
  BluebyteETC1Asset,
  BluebyteWSTETH1Asset,
  BluebyteXLM1Asset,
  BluebyteBNT1Asset,
  BluebyteBAT1Asset,
  BluebyteC98Asset,
  BluebytePYTH1Asset
]
//
// ----- JRC20 Assets -----
//
const jrc20Assets: JRC20Asset[] = [
  new JRC20Asset('0x2d00000000000000000000000000000000000000', 'PayPal USD', 'PYUSD', 9, BluebytePYUSD1Asset.assetId),
  new JRC20Asset('0x2e00000000000000000000000000000000000000', 'LCX', 'LCX', 9, BluebyteLCX1Asset.assetId),
  new JRC20Asset('0x2f00000000000000000000000000000000000000', 'Nexo', 'NEXO', 9, BluebyteNEXO1Asset.assetId),
  new JRC20Asset('0x3000000000000000000000000000000000000000', 'SwissBorg', 'BORG', 9, BluebyteBORG1Asset.assetId),
  new JRC20Asset('0x3100000000000000000000000000000000000000', 'Ethereum Classic', 'ETC', 9, BluebyteETC1Asset.assetId),
  new JRC20Asset(
    '0x3200000000000000000000000000000000000000',
    'Wrapped Liquid Staked Ether',
    'wstETH',
    9,
    BluebyteWSTETH1Asset.assetId
  ),
  new JRC20Asset('0x3300000000000000000000000000000000000000', 'Stellar', 'XLM', 9, BluebyteXLM1Asset.assetId),
  new JRC20Asset('0x3400000000000000000000000000000000000000', 'Bancor', 'BNT', 9, BluebyteBNT1Asset.assetId),
  new JRC20Asset(
    '0x3500000000000000000000000000000000000000',
    'Basic Attention Token',
    'BAT',
    9,
    BluebyteBAT1Asset.assetId
  ),
  new JRC20Asset('0x3600000000000000000000000000000000000000', 'Coin98', 'C98', 9, BluebyteC98Asset.assetId),
  new JRC20Asset('0x3700000000000000000000000000000000000000', 'Pyth Network', 'PYTH', 9, BluebytePYTH1Asset.assetId)
]
export const BluebyteWBBY1Asset = new WrappedAsset(
  '0x36aD1F7DCCbafAdC23Fcec2fAb1BEFE45e10b04A',
  'Wrapped Blue Byte1',
  'wBBY1',
  18
)
//
// ----- CHAINS -----
//
export const BluebytePlatformChain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  BluebyteBBY1Asset,
  BluebyteStakeConfig,
  BluebyteRewardConfig,
  ['P'],
  jntAssets
)
export const BluebyteJVMChain = new JVMBlockchain(
  'JVM-Chain',
  'X4g4aZZRKBoDy7uPF13mVfFbaaYcYUrJPxavvVMNoBTPpyYhy',
  BluebyteBBY1Asset,
  ['JVM'],
  jntAssets
)
export const BluebyteBLUEBYTE1Chain = new JEVMBlockchain(
  'BLUEBYTE1-Chain',
  '2ZcsZnWDdetYSKi7XEQuzFcwRPFUUiye9H6he9AaRboQikdrcA',
  new JEVMGasToken(BluebyteBBY1Asset),
  BigInt(75003),
  BigInt('2000000000'),
  BluebyteAddress,
  ['BLUEBYTE1'],
  jrc20Assets,
  jrc20Assets
  // BluebyteWBBY1Asset,
)
export const BluebytePYUSD1Chain = new JEVMBlockchain(
  'PYUSD1-Chain',
  '2w9UuqZFD3ggm7n7z1Mdc9EXZzTD1tdnRKzZBpS8hWL5CoctJJ',
  new JEVMGasToken(BluebytePYUSD1Asset),
  BigInt(75004),
  BigInt('476000000000'),
  BluebyteAddress,
  ['PYUSD1'],
  [BluebyteBBY1Asset]
)
export const BluebyteLCX1Chain = new JEVMBlockchain(
  'LCX1-Chain',
  '29siH3Mi8jVjYWe5i2N9ep5HR9Wgo9TtJeRmTp5JFacicE7afn',
  new JEVMGasToken(BluebyteLCX1Asset),
  BigInt(75005),
  BigInt('3968000000000'),
  BluebyteAddress,
  ['LCX1'],
  [BluebyteBBY1Asset]
)
export const BluebyteNEXO1Chain = new JEVMBlockchain(
  'NEXO1-Chain',
  'cZditDFwVuX2DyYzqVjRRnRkgL9iuTA1nJv6cmdAxsLpmxEhf',
  new JEVMGasToken(BluebyteNEXO1Asset),
  BigInt(75006),
  BigInt('467000000000'),
  BluebyteAddress,
  ['NEXO1'],
  [BluebyteBBY1Asset]
)
export const BluebyteBORG1Chain = new JEVMBlockchain(
  'BORG1-Chain',
  'DExJpQJBHFzb73vVStQMX71nKREqscgYVRxr1q7QN42QhRSH4',
  new JEVMGasToken(BluebyteBORG1Asset),
  BigInt(75007),
  BigInt('2700000000000'),
  BluebyteAddress,
  ['BORG1'],
  [BluebyteBBY1Asset]
)
export const BluebyteETC1Chain = new JEVMBlockchain(
  'ETC1-Chain',
  'TAHHLc94EM1aHdH3fXs6ypKTAZafpYVSw3GUPjxHAycV7yF8V',
  new JEVMGasToken(BluebyteETC1Asset),
  BigInt(75008),
  BigInt('32000000000'),
  BluebyteAddress,
  ['ETC1'],
  [BluebyteBBY1Asset]
)
export const BluebyteWSTETH1Chain = new JEVMBlockchain(
  'wstETH1-Chain',
  '2fMUa9XEKVA3Zvj6QzsgDv2LcxnumRCLAjEg1pYfu6Ag58DoMp',
  new JEVMGasToken(BluebyteWSTETH1Asset),
  BigInt(75009),
  BigInt('1000000000'),
  BluebyteAddress,
  ['wstETH1'],
  [BluebyteBBY1Asset]
)
export const BluebyteXLM1Chain = new JEVMBlockchain(
  'XLM1-Chain',
  '2Gkjwp2wX3yuhMft9ANny6zd7F6iLoeT4zYtSuQLAWmw2Uc2Jj',
  new JEVMGasToken(BluebyteXLM1Asset),
  BigInt(75010),
  BigInt('198000000000'),
  BluebyteAddress,
  ['XLM1'],
  [BluebyteBBY1Asset]
)
export const BluebyteBNT1Chain = new JEVMBlockchain(
  'BNT1-Chain',
  'AgzLQyDmMrJgwhX2fWLsQXNQJ93xmVoA1bsyhSg2QDcSYzhNQ',
  new JEVMGasToken(BluebyteBNT1Asset),
  BigInt(75011),
  BigInt('1701000000000'),
  BluebyteAddress,
  ['BNT1'],
  [BluebyteBBY1Asset]
)
export const BluebyteBAT1Chain = new JEVMBlockchain(
  'BAT1-Chain',
  '2g6N5jygCtVQXUo2SkU3ZgPrrLn9dkPcfSXHAmnaRUimRPh2WL',
  new JEVMGasToken(BluebyteBAT1Asset),
  BigInt(75012),
  BigInt('3903000000000'),
  BluebyteAddress,
  ['BAT1'],
  [BluebyteBBY1Asset]
)
export const BluebyteC98Chain = new JEVMBlockchain(
  'C98-Chain',
  '2VnAvo78U7xPoTvMGi8j32Y759sWUEDSr92vSHbxZWpBjmVGg',
  new JEVMGasToken(BluebyteC98Asset),
  BigInt(75013),
  BigInt('9158000000000'),
  BluebyteAddress,
  ['C98'],
  [BluebyteBBY1Asset]
)
export const BluebytePYTH1Chain = new JEVMBlockchain(
  'PYTH1-Chain',
  'qh29L3Y4r6a5qzh8Geu6J8sF3Na9KvyUu2EK7b6oji8p1bSv9',
  new JEVMGasToken(BluebytePYTH1Asset),
  BigInt(75014),
  BigInt('3810000000000'),
  BluebyteAddress,
  ['PYTH1'],
  [BluebyteBBY1Asset]
)

export const BluebytePrimarySupernet = new PrimarySupernet(
  '11111111111111111111111111111111LpoYY',
  [
    BluebytePlatformChain,
    BluebyteJVMChain,
    BluebyteBLUEBYTE1Chain,
    BluebytePYUSD1Chain,
    BluebyteLCX1Chain,
    BluebyteNEXO1Chain,
    BluebyteBORG1Chain,
    BluebyteETC1Chain,
    BluebyteWSTETH1Chain,
    BluebyteXLM1Chain,
    BluebyteBNT1Chain,
    BluebyteBAT1Chain,
    BluebyteC98Chain,
    BluebytePYTH1Chain
  ],
  BluebytePlatformChain,
  BluebyteJVMChain,
  BluebyteBLUEBYTE1Chain
)

export const BluebyteNetwork = new MCN(
  BluebyteNetworkName,
  BluebyteAddress,
  BluebyteNetworkId,
  BluebyteHrp,
  BluebytePrimarySupernet
)
