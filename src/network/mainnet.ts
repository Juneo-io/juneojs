import { JEVMGasToken, JNTAsset, JRC20Asset, WrappedAsset } from '../asset'
import { JEVMBlockchain, JVMBlockchain, PlatformBlockchain, RewardConfig, StakeConfig } from '../chain'
import { MCN, PrimarySupernet } from './network'

const MainnetNetworkName = 'Juneo Mainnet'
const MainnetNetworkId = 45
const MainnetHrp = 'june'
const MainnetStakeConfig = new StakeConfig(
  0.8, // 80%
  BigInt(100_000000000), // 100 JUNE
  BigInt(30_000_000000000), // 30_000 JUNE
  BigInt(1_0000000), // 0.01 JUNE
  12_0000, // 12%
  12_0000, // 12%
  BigInt(14 * 86_400), // 14 days
  BigInt(365 * 86_400) // 365 days
)
const MainnetRewardConfig = new RewardConfig(
  BigInt(1_209_600), // 14 day
  BigInt(31_536_000), // 365 days
  BigInt(2_0000), // 2%
  BigInt(1721001600), // 15th July 2024
  BigInt(21_5000), // 21.5%
  BigInt(1847232000), // 15th July  2028
  BigInt(19_5000), // 19.5%
  BigInt(1878768000), // 15th July  2029
  BigInt(6_7000) // 6.7%
)
const MainnetAddress = 'https://rpc.juneo-mainnet.network'

export const MainnetJUNEAssetId = '3WWxh5JEz7zu1RWdRxS6xugusNWzFFPwPw1xnZfAGzaAj8sTp'
export const MainnetUSDT1AssetId = '2VsLGMQuboTekStUVqWC2JdLHQAb1rdYHTP9LRsy17ccEpNGH9'
export const MainnetUSD1AssetId = 'pphgq7o18cXuAN5eKd8UAUwH82jbvBudZYbXZAXo6V8cQUqdi'
export const MainnetDAI1AssetId = '2CFSqAJmkcv1k3YztAti5xArYA2P1qLHQvYJMBMAastaK7uMZK'
export const MainnetEUR1AssetId = '2BmogavsvNJaHWPy57aBKbENDYsADnm5D9oZQBt6tLT9QZQQnk'
export const MainnetSGD1AssetId = '2d6VUk1PZuSsJnPLrQAUFAdu3CYP3qAdJBEVKALGbhvNYeCtoW'
export const MainnetGLD1AssetId = 'xGp8EATJr9KQo6QzFvxMwuUmHxL1VeGJNtJioYtTyA3UkpU2n'
export const MainnetMBTC1AssetId = 'rkLkqF8AMeTkoYqJxfuYzaqkQeSNvdDiL4U22jpeRqmnF4viP'
export const MainnetDOGE1AssetId = 'd32ReERCrhugunBN5DAkpoyYn9fKkCWrGLzmuuP6yEpUi7ZhX'
export const MainnetLTC1AssetId = 'oqeT5dYJ8137PLM2TNgqXMrZW5dxR5tkYkR4XaMuVyyWfnJ7a'
export const MainnetBCH1AssetId = '2ZYG9EjfvzarZ3mVcxZkop9NwKBLVKb8T9L2e2FMkNcrDTHeJY'
export const MainnetLINK1AssetId = '2hPijeptQqHYwFEEpPBiuAWtAGNdiffWradYLvTXUMAc2r1YZf'

export const MainnetJUNEAsset = new JNTAsset(MainnetJUNEAssetId, 'JUNE', 'JUNE', 9, false)
export const MainnetUSDT1Asset = new JNTAsset(MainnetUSDT1AssetId, 'USDT1', 'USDT1', 9, false)
export const MainnetUSD1Asset = new JNTAsset(MainnetUSD1AssetId, 'USD1', 'USD1', 9, false)
export const MainnetDAI1Asset = new JNTAsset(MainnetDAI1AssetId, 'DAI1', 'DAI1', 9, false)
export const MainnetEUR1Asset = new JNTAsset(MainnetEUR1AssetId, 'EUR1', 'EUR1', 9, false)
export const MainnetSGD1Asset = new JNTAsset(MainnetSGD1AssetId, 'SGD1', 'SGD1', 9, false)
export const MainnetGLD1Asset = new JNTAsset(MainnetGLD1AssetId, 'GLD1', 'GLD1', 9, false)
export const MainnetMBTC1Asset = new JNTAsset(MainnetMBTC1AssetId, 'mBTC1', 'mBTC1', 9, false)
export const MainnetDOGE1Asset = new JNTAsset(MainnetDOGE1AssetId, 'DOGE1', 'DOGE1', 9, false)
export const MainnetLTC1Asset = new JNTAsset(MainnetLTC1AssetId, 'LTC1', 'LTC1', 9, false)
export const MainnetBCH1Asset = new JNTAsset(MainnetBCH1AssetId, 'BCH1', 'BCH1', 9, false)
export const MainnetLINK1Asset = new JNTAsset(MainnetLINK1AssetId, 'LINK1', 'LINK1', 9, false)
// JUNE is omitted here because it should be registered by default as the chain asset
const jntAssets: JNTAsset[] = [
  MainnetUSDT1Asset,
  MainnetUSD1Asset,
  MainnetDAI1Asset,
  MainnetEUR1Asset,
  MainnetSGD1Asset,
  MainnetGLD1Asset,
  MainnetMBTC1Asset,
  MainnetDOGE1Asset,
  MainnetLTC1Asset,
  MainnetBCH1Asset,
  MainnetLINK1Asset
]

export const MainnetPlatformChain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  MainnetJUNEAsset,
  MainnetStakeConfig,
  MainnetRewardConfig,
  ['P'],
  jntAssets
)
export const MainnetJVMChain = new JVMBlockchain(
  'JVM-Chain',
  'TS7kcXZxCtW7aLYfRMj7oJHTq1BKyU8LRddvdPyM4gPQe3xYt',
  MainnetJUNEAsset,
  ['JVM'],
  jntAssets
)
const jrc20Assets: JRC20Asset[] = [
  new JRC20Asset('0x2d00000000000000000000000000000000000000', 'USDT.e', 'USDT.e', 9, MainnetUSDT1AssetId),
  new JRC20Asset('0x2e00000000000000000000000000000000000000', 'USD1.e', 'USD1.e', 9, MainnetUSD1AssetId),
  new JRC20Asset('0x2f00000000000000000000000000000000000000', 'DAI.e', 'DAI.e', 9, MainnetDAI1AssetId),
  new JRC20Asset('0x3000000000000000000000000000000000000000', 'EUR1.e', 'EUR1.e', 9, MainnetEUR1AssetId),
  new JRC20Asset('0x3100000000000000000000000000000000000000', 'SGD1.e', 'SGD1.e', 9, MainnetSGD1AssetId),
  new JRC20Asset('0x3200000000000000000000000000000000000000', 'GLD1.e', 'GLD1.e', 9, MainnetGLD1AssetId),
  new JRC20Asset('0x3300000000000000000000000000000000000000', 'mBTC.a', 'mBTC.a', 9, MainnetMBTC1AssetId),
  new JRC20Asset('0x3400000000000000000000000000000000000000', 'DOGE.b', 'DOGE.b', 9, MainnetDOGE1AssetId),
  new JRC20Asset('0x3500000000000000000000000000000000000000', 'LTC.b', 'LTC.b', 9, MainnetLTC1AssetId),
  new JRC20Asset('0x3600000000000000000000000000000000000000', 'BCH.b', 'BCH.b', 9, MainnetBCH1AssetId),
  new JRC20Asset('0x3700000000000000000000000000000000000000', 'LINK.e', 'LINK.e', 9, MainnetLINK1AssetId)
]
export const MainnetWJUNEAsset = new WrappedAsset(
  '0x466e8b1156e49D29B70447a9Af68038cF5562BdD',
  'Wrapped JUNE',
  'wJUNE',
  18
)
export const MainnetJUNEChain = new JEVMBlockchain(
  'JUNE-Chain',
  '2XjWAiAdw3BR56KhPSPxKJNzea2Ebvc67uhE1DTN9NsqCyP9eW',
  new JEVMGasToken(MainnetJUNEAsset),
  BigInt(45003),
  BigInt('48000000000'),
  MainnetAddress,
  ['JUNE'],
  jrc20Assets,
  jrc20Assets,
  MainnetWJUNEAsset
)
export const MainnetUSDT1Chain = new JEVMBlockchain(
  'USDT1-Chain',
  'xSKyNAhrJEfNyC3JCVxGdBa4MyjV21zUzQNDChpzHtYJ2c3pj',
  new JEVMGasToken(MainnetUSDT1Asset),
  BigInt(45005),
  BigInt('943000000000'),
  MainnetAddress,
  ['USDT1'],
  [MainnetJUNEAsset]
)
export const MainnetUSD1Chain = new JEVMBlockchain(
  'USD1-Chain',
  'ebp1w3w7rgWJr8hKeKZbtiXojSGbmu2p7Kah8tVbgbgxGLduT',
  new JEVMGasToken(MainnetUSD1Asset),
  BigInt(45006),
  BigInt('943000000000'),
  MainnetAddress,
  ['USD1'],
  [MainnetJUNEAsset]
)
export const MainnetDAI1Chain = new JEVMBlockchain(
  'DAI1-Chain',
  'PMuHHig6Evi2HDWUFUmPWFpvvjDPWzuUtt9WnciKFdZAgSj5N',
  new JEVMGasToken(MainnetDAI1Asset),
  BigInt(45004),
  BigInt('943000000000'),
  MainnetAddress,
  ['DAI1'],
  [MainnetJUNEAsset]
)
export const MainnetEUR1Chain = new JEVMBlockchain(
  'EUR1-Chain',
  '2fLEwhs3wCx6fBVQ3rKKYZtXiT5uXHjgpCZKWp6iKBEWHegtXx',
  new JEVMGasToken(MainnetEUR1Asset),
  BigInt(45011),
  BigInt('857000000000'),
  MainnetAddress,
  ['EUR1'],
  [MainnetJUNEAsset]
)
export const MainnetSGD1Chain = new JEVMBlockchain(
  'SGD1-Chain',
  '2K8AUycQ36eMxs7sWNAFk4o95skQRrB53rY4DXub4kwNyNft9i',
  new JEVMGasToken(MainnetSGD1Asset),
  BigInt(45012),
  BigInt('1257000000000'),
  MainnetAddress,
  ['SGD1'],
  [MainnetJUNEAsset]
)
export const MainnetGLD1Chain = new JEVMBlockchain(
  'GLD1-Chain',
  '3k2Rxfz1EawisiFjhtdJ8pvTQ7dwXz7KrMpNAPmkpHLtY6SiJ',
  new JEVMGasToken(MainnetGLD1Asset),
  BigInt(45008),
  BigInt('2000000000'),
  MainnetAddress,
  ['GLD1'],
  [MainnetJUNEAsset]
)
export const MainnetMBTC1Chain = new JEVMBlockchain(
  'mBTC1-Chain',
  '2qo4khKnGPez5xnUSPJKWUAvRimio86gN8TDqMsEspYdT3Z5Yu',
  new JEVMGasToken(MainnetMBTC1Asset),
  BigInt(45007),
  BigInt('22000000000'),
  MainnetAddress,
  ['mBTC1'],
  [MainnetJUNEAsset]
)
export const MainnetDOGE1Chain = new JEVMBlockchain(
  'DOGE1-Chain',
  's6AyhDbNGPw6eSQuseQLywWCThfNtMsM21HV27pSoM7FLHhoJ',
  new JEVMGasToken(MainnetDOGE1Asset),
  BigInt(45010),
  BigInt('9524000000000'),
  MainnetAddress,
  ['DOGE1'],
  [MainnetJUNEAsset]
)
export const MainnetLTC1Chain = new JEVMBlockchain(
  'LTC1-Chain',
  'iFQE4KDJKD95rNN3oFJ5FyufsL6p6CdhEZi8ZRTe4VBKvyrr7',
  new JEVMGasToken(MainnetLTC1Asset),
  BigInt(45009),
  BigInt('17000000000'),
  MainnetAddress,
  ['LTC1'],
  [MainnetJUNEAsset]
)
export const MainnetBCH1Chain = new JEVMBlockchain(
  'BCH1-Chain',
  '2Hm47qrPwjq5JmZuSEv5PrPZ2pF4qJVWTppvmddCbcvmpqUeBt',
  new JEVMGasToken(MainnetBCH1Asset),
  BigInt(45013),
  BigInt('3000000000'),
  MainnetAddress,
  ['BCH1'],
  [MainnetJUNEAsset]
)
export const MainnetLINK1Chain = new JEVMBlockchain(
  'LINK1-Chain',
  '2fUcPShTQQUcqLhZjpRA8apB9cXNFW5e3cbTrtmmAvYcpD4P4m',
  new JEVMGasToken(MainnetLINK1Asset),
  BigInt(45014),
  BigInt('102000000000'),
  MainnetAddress,
  ['LINK1'],
  [MainnetJUNEAsset]
)

export const MainnetPrimarySupernet = new PrimarySupernet(
  '11111111111111111111111111111111LpoYY',
  [
    MainnetPlatformChain,
    MainnetJVMChain,
    MainnetJUNEChain,
    MainnetUSDT1Chain,
    MainnetUSD1Chain,
    MainnetDAI1Chain,
    MainnetEUR1Chain,
    MainnetSGD1Chain,
    MainnetGLD1Chain,
    MainnetMBTC1Chain,
    MainnetDOGE1Chain,
    MainnetLTC1Chain,
    MainnetBCH1Chain,
    MainnetLINK1Chain
  ],
  MainnetPlatformChain,
  MainnetJVMChain,
  MainnetJUNEChain
)

export const MainNetwork = new MCN(
  MainnetNetworkName,
  MainnetAddress,
  MainnetNetworkId,
  MainnetHrp,
  MainnetPrimarySupernet
)
