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
const BluebyteAddress = 'https://rpc.bluebyte1-mainnet.network/ext/health'

export const BluebyteBBY1AssetId = '2a6i1usvJKegJEte8MDWkz9WkoFeWg3siz2fk2SqiSojNLrLZW'
export const BluebytePYUSD1AssetId = '2tZD8KnDoetXiCJTU6xvx2CvqiShkvYw7e1kMZjwz6asmu8rPs'
export const BluebyteLCX1AssetId = 'ytRcYav3jag9edNmv5mXjGBHtXUpcSG8mMZ47VvU9sXbnsV3D'
export const BluebyteNEXO1AssetId = 'Z5oZxb4WrcjrN2xXTDe5oqNQWJyoQno7kZy7i8Vc2V5GD86dq'
export const BluebyteBORG1AssetId = '2K7vqY67VbuTRYQEAtjjVUWxKMPf41cucWmwYsGvD7KSaVsTjk'
export const BluebyteETC1AssetId = '9KeJRHoX5mKuxcqX4kBsiYtFNDGxsbZypy2CXc2WMAAApEYkZ'
export const BluebyteWSTETH1AssetId = '2ek4B7JERvTa6Jg6ZEtBsdwsR5z9hSfTt8BVKbJkMaDe1iFCTL'
export const BluebyteXLM1AssetId = '2heXKMixq4FqTJQFXZnRHfzTxBv3E4LVDxdV5xsC6QWwFCTJNf'
export const BluebyteBNT1AssetId = '3Rz3GPmkreZckvz793KCZ8ypzUPXfWTW6aSoCWdGWAnEEwDbt'
export const BluebyteBAT1AssetId = '2PkV8iFxY6AajJgXnHKLfWVUYuP9CWTXB4H4YuHwstVYNQ5PZq'
export const BluebyteC98AssetId = '2mMoHTWjGxMUP7n1Jzw1Rt29usvBkYmwT4xdMqYuTYwb6kVnXf'
export const BluebytePYTH1AssetId = '2K9CqrFdVcM6WSowtisUuGA6QcTroBAQyi3U9Mu246pcWucEF3'

export const BluebyteBBY1Asset = new JNTAsset(BluebyteBBY1AssetId, 'Blue Byte1', 'BBY1', 9, false)
export const BluebytePYUSD1Asset = new JNTAsset(BluebytePYUSD1AssetId, 'PayPal USD', 'PYUSD1', 9, false)
export const BluebyteLCX1Asset = new JNTAsset(BluebyteLCX1AssetId, 'LCX', 'LCX1', 9, false)
export const BluebyteNEXO1Asset = new JNTAsset(BluebyteNEXO1AssetId, 'Nexo', 'NEXO1', 9, false)
export const BluebyteBORG1Asset = new JNTAsset(BluebyteBORG1AssetId, 'SwissBorg', 'BORG1', 9, false)
export const BluebyteETC1Asset = new JNTAsset(BluebyteETC1AssetId, 'Ethereum Classic', 'ETC1', 9, false)
export const BluebyteWSTETH1Asset = new JNTAsset(BluebyteWSTETH1AssetId, 'wstETH1', 'wstETH1', 9, false)
export const BluebyteXLM1Asset = new JNTAsset(BluebyteXLM1AssetId, 'Stellar', 'XLM1', 9, false)
export const BluebyteBNT1Asset = new JNTAsset(BluebyteBNT1AssetId, 'Bancor', 'BNT1', 9, false)
export const BluebyteBAT1Asset = new JNTAsset(BluebyteBAT1AssetId, 'Basic Attention Token', 'BAT1', 9, false)
export const BluebyteC98Asset = new JNTAsset(BluebyteC98AssetId, 'Coin98', 'C98', 9, false)
export const BluebytePYTH1Asset = new JNTAsset(BluebytePYTH1AssetId, 'Pyth Network', 'PYTH1', 9, false)
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
  'wjygmKFFhcfWUVQG4hgh3KZBC426Fex8iqZQH8yG27Zk6REKQ',
  BluebyteBBY1Asset,
  ['JVM'],
  jntAssets
)
const jrc20Assets: JRC20Asset[] = [
  new JRC20Asset('0x2d00000000000000000000000000000000000000', 'PayPal USD', 'PYUSD', 9, BluebytePYUSD1AssetId),
  new JRC20Asset('0x2e00000000000000000000000000000000000000', 'LCX', 'LCX', 9, BluebyteLCX1AssetId),
  new JRC20Asset('0x2f00000000000000000000000000000000000000', 'Nexo', 'NEXO', 9, BluebyteNEXO1AssetId),
  new JRC20Asset('0x3000000000000000000000000000000000000000', 'SwissBorg', 'BORG', 9, BluebyteBORG1AssetId),
  new JRC20Asset('0x3100000000000000000000000000000000000000', 'Ethereum Classic', 'ETC', 9, BluebyteETC1AssetId),
  new JRC20Asset(
    '0x3200000000000000000000000000000000000000',
    'Wrapped Liquid Staked Ether',
    'wstETH',
    9,
    BluebyteWSTETH1AssetId
  ),
  new JRC20Asset('0x3300000000000000000000000000000000000000', 'Stellar', 'XLM', 9, BluebyteXLM1AssetId),
  new JRC20Asset('0x3400000000000000000000000000000000000000', 'Bancor', 'BNT', 9, BluebyteBNT1AssetId),
  new JRC20Asset('0x3500000000000000000000000000000000000000', 'Basic Attention Token', 'BAT', 9, BluebyteBAT1AssetId),
  new JRC20Asset('0x3600000000000000000000000000000000000000', 'Coin98', 'C98', 9, BluebyteC98AssetId),
  new JRC20Asset('0x3700000000000000000000000000000000000000', 'Pyth Network', 'PYTH', 9, BluebytePYTH1AssetId)
]
export const BluebyteWBBY1Asset = new WrappedAsset(
  '0x466e8b1156e49D29B70447a9Af68038cF5562BdD',
  'Wrapped Blue Byte1',
  'wBBY',
  18
)
export const BluebyteBluebyte1Chain = new JEVMBlockchain(
  'Bluebyte1-Chain',
  'z6p4dRDZC2edxEVYP1h8RUTd4zLDnbBbURNZHXZXs7nCzRgcN',
  new JEVMGasToken(BluebyteBBY1Asset),
  BigInt(75003),
  BigInt('225000000000'),
  BluebyteAddress,
  ['Bluebyte1'],
  jrc20Assets,
  jrc20Assets
  // BluebyteWBBY1Asset,
)
export const BluebytePYUSD1Chain = new JEVMBlockchain(
  'PYUSD1-Chain',
  'NztxaWpmBWz3Wd7DyA9BUgCDvTCihJV4ofbcUuvfZsFtjrT7W',
  new JEVMGasToken(BluebytePYUSD1Asset),
  BigInt(75004),
  BigInt('25000000000'),
  BluebyteAddress,
  ['PYUSD1'],
  [BluebyteBBY1Asset]
)
export const BluebyteLCX1Chain = new JEVMBlockchain(
  'LCX1-Chain',
  'H7vXTgcaWkynqCckc2WB9w86y4hNP2QwNyXyoLUjF7jofGqxo',
  new JEVMGasToken(BluebyteLCX1Asset),
  BigInt(75005),
  BigInt('25000000000'),
  BluebyteAddress,
  ['LCX1'],
  [BluebyteBBY1Asset]
)
export const BluebyteNEXO1Chain = new JEVMBlockchain(
  'NEXO1-Chain',
  'G6WiqhMZB6AerrmNV9itCoPjeh2y41w2wNaFxtd3ogj4dtNAy',
  new JEVMGasToken(BluebyteNEXO1Asset),
  BigInt(75006),
  BigInt('25000000000'),
  BluebyteAddress,
  ['NEXO1'],
  [BluebyteBBY1Asset]
)
export const BluebyteBORG1Chain = new JEVMBlockchain(
  'BORG1-Chain',
  'iwxw4t3YcCzN3bCoKUFjT7A5N4ZZCcUgUGvAxCyBBqexxHmKN',
  new JEVMGasToken(BluebyteBORG1Asset),
  BigInt(75007),
  BigInt('25000000000'),
  BluebyteAddress,
  ['BORG1'],
  [BluebyteBBY1Asset]
)
export const BluebyteETC1Chain = new JEVMBlockchain(
  'ETC1-Chain',
  '2Q2xLN6eP1EbmdNGNoPdB7m71wfrHDyUGGxjZvnwWNCMoACXkz',
  new JEVMGasToken(BluebyteETC1Asset),
  BigInt(75008),
  BigInt('25000000000'),
  BluebyteAddress,
  ['ETC1'],
  [BluebyteBBY1Asset]
)
export const BluebyteWSTETH1Chain = new JEVMBlockchain(
  'wstETH1-Chain',
  'C29tyURDkN18KW9nCcnpuv1JRDHx9aE99BcKMQsuhtYcvqqwH',
  new JEVMGasToken(BluebyteWSTETH1Asset),
  BigInt(75009),
  BigInt('25000000000'),
  BluebyteAddress,
  ['wstETH1'],
  [BluebyteBBY1Asset]
)
export const BluebyteXLM1Chain = new JEVMBlockchain(
  'XLM1-Chain',
  'T6AKZ31q8vqWNcXr3upKUXMf7QcJnQpibsW4BGWA3JHn6xpZ7',
  new JEVMGasToken(BluebyteXLM1Asset),
  BigInt(75010),
  BigInt('25000000000'),
  BluebyteAddress,
  ['XLM1'],
  [BluebyteBBY1Asset]
)
export const BluebyteBNT1Chain = new JEVMBlockchain(
  'BNT1-Chain',
  'G1Drw4geZkM1kg7yTDAHiFEbt6m6cr3PL5YAdJdEig8oSt5UP',
  new JEVMGasToken(BluebyteBNT1Asset),
  BigInt(75011),
  BigInt('25000000000'),
  BluebyteAddress,
  ['BNT1'],
  [BluebyteBBY1Asset]
)
export const BluebyteBAT1Chain = new JEVMBlockchain(
  'BAT1-Chain',
  '2HZFMRSnQkXg1r2VgdmNXJttdHccr3yj5idhdxQCVSJnW1bhGq',
  new JEVMGasToken(BluebyteBAT1Asset),
  BigInt(75012),
  BigInt('25000000000'),
  BluebyteAddress,
  ['BAT1'],
  [BluebyteBBY1Asset]
)
export const BluebyteC98Chain = new JEVMBlockchain(
  'C98-Chain',
  '2eSJkBh3MyiJuqG2C1WV86BHn1bpHWo4EQR6XPrhQNMxMbS9Pk',
  new JEVMGasToken(BluebyteC98Asset),
  BigInt(75013),
  BigInt('25000000000'),
  BluebyteAddress,
  ['C98'],
  [BluebyteBBY1Asset]
)
export const BluebytePYTH1Chain = new JEVMBlockchain(
  'PYTH1-Chain',
  '2sWqw92R2MrNP93pHLF7GYBJ1Y1eXQGkpoNEnHy4ubm9dj82Vx',
  new JEVMGasToken(BluebytePYTH1Asset),
  BigInt(75014),
  BigInt('25000000000'),
  BluebyteAddress,
  ['PYTH1'],
  [BluebyteBBY1Asset]
)

export const BluebytePrimarySupernet = new PrimarySupernet(
  '11111111111111111111111111111111LpoYY',
  [
    BluebytePlatformChain,
    BluebyteJVMChain,
    BluebyteBluebyte1Chain,
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
  BluebyteBluebyte1Chain
)

export const BluebyteNetwork = new MCN(
  BluebyteNetworkName,
  BluebyteAddress,
  BluebyteNetworkId,
  BluebyteHrp,
  BluebytePrimarySupernet
)
