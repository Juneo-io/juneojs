import { JEVMGasToken, JNTAsset } from '../asset'
import { JEVMBlockchain, JVMBlockchain, PlatformBlockchain, RewardConfig, StakeConfig } from '../chain'
import { MCN, PrimarySupernet } from './network'

const LocalNetworkName = 'Local Devnet'
const LocalNetworkId = 12345
const LocalHrp = 'local'
const LocalStakeConfig = new StakeConfig(
  0.8, // 80%
  BigInt(1_000000000), // 1 JUNE
  BigInt(1_000_000_000000000), // 100_000 JUNE
  BigInt(1_0000000), // 0.01 JUNE
  12_0000, // 12%
  12_0000, // 12%
  BigInt(86_400), // 1 day
  BigInt(365 * 86_400) // 365 days
)
const LocalRewardConfig = new RewardConfig(
  BigInt(86_400), // 1 day
  BigInt(31_536_000), // 365 days
  BigInt(2_0000), // 2%
  BigInt(1685570400), // 1st June 2023
  BigInt(21_5000), // 21.5%
  BigInt(1811800800), // 2027
  BigInt(19_5000), // 19.5%
  BigInt(1843423200), // 2028
  BigInt(6_7000) // 6.7%
)
const LocalAddress = 'http://127.0.0.1:9650'

export const LocalJUNEAssetId = 'CJNB9rL9AoeL1yXhx91hL7aN6cgMUHsJJBHL5KhkJGuWDewrc'
export const LocalETH1AssetId = 'nktDJbBBuDqR39T4FxVZq3UEKUGa7x99irKgbQQRxDWXUHbg4'
export const LocalMBTC1AssetId = 'u2ZYLhvGCMb2a2uCJYWmokzrs5nH5AzheZtuFeAEc4ew8s1y6'
export const LocalDOGE1AssetId = '2moVWus1GJhY8u758r7RkYyMDohzVYsGCeKLtnKXGeEair3xzM'
export const LocalUSDT1AssetId = 'EMwudc6prKBwBjNLebRnxQUH3jJHMHs3ZK8iiUd5QmXZuaMwq'
export const LocalDAI1AssetId = 'J4se1ySSqQvCZsN231EqwKpzJ77f5VwFQMyFRnqf6sPoFLCJV'
export const LocalEUROC1AssetId = '2BHhvtDaZfWzKmB4Brc5drac5whCpFKXTTLvkg7WbbwRXWxrWC'
export const LocalLTC1AssetId = '2JrAJvq5v9xghGr4avA52YVmHfoibKXaYwP6u4BVb5HXDKVGUj'
export const LocalXLM1AssetId = '2jjXPFioyppdsfFhjKFshQEp5BtttNQS633emdAfg6ARXDEUkw'
export const LocalBCH1AssetId = '2nag6fGNnuXcjNoBLccfAWoGf2bTxvgmWRh4FTEraymRxywEo8'
export const LocalPAXG1AssetId = 'zb5SyLzBiubdGqQ9Fz6yugiPYvLX7MjWCHMjw4v3kBPRQDDPB'
export const LocalXSGD1AssetId = '2rR2QsGJJXeWRrNA15BaqLadvEC1sCUj4M77uoG3YYooP9Z7nE'
export const LocalETC1AssetId = '2ku2KPR43vhVUyBNT17yu2q5fXTT9VNZSQMhPBmtnev6QJbm7H'
export const LocalR1000AssetId = '2detzzUKDshXyYrXLpe2tczd84T4pU7SdQtsZqmWHSLpoz2u92'
export const LocalR10AssetId = '2WxMKug8STh4PF6VcpXbrsfX2gAj2q1LmNArZ8FnrhzF79AAPD'

export const LocalJUNEAsset = new JNTAsset(LocalJUNEAssetId, 'JUNE', 'JUNE', 9, false)
export const LocalETH1Asset = new JNTAsset(LocalETH1AssetId, 'ETH1', 'ETH1', 9, false)
export const LocalMBTC1Asset = new JNTAsset(LocalMBTC1AssetId, 'mBTC1', 'mBTC1', 9, false)
export const LocalDOGE1Asset = new JNTAsset(LocalDOGE1AssetId, 'DOGE1', 'DOGE1', 9, false)
export const LocalUSDT1Asset = new JNTAsset(LocalUSDT1AssetId, 'USDT1', 'USDT1', 9, false)
export const LocalDAI1Asset = new JNTAsset(LocalDAI1AssetId, 'DAI1', 'DAI1', 9, false)
export const LocalEUROC1Asset = new JNTAsset(LocalEUROC1AssetId, 'EUROC1', 'EUROC1', 9, false)
export const LocalLTC1Asset = new JNTAsset(LocalLTC1AssetId, 'LTC1', 'LTC1', 9, false)
export const LocalXLM1Asset = new JNTAsset(LocalXLM1AssetId, 'XLM1', 'XLM1', 9, false)
export const LocalBCH1Asset = new JNTAsset(LocalBCH1AssetId, 'BCH1', 'BCH1', 9, false)
export const LocalPAXG1Asset = new JNTAsset(LocalPAXG1AssetId, 'PAXG1', 'PAXG1', 9, false)
export const LocalXSGD1Asset = new JNTAsset(LocalXSGD1AssetId, 'XSGD1', 'XSGD1', 9, false)
export const LocalETC1Asset = new JNTAsset(LocalETC1AssetId, 'ETC1', 'ETC1', 9, false)
export const LocalR1000Asset = new JNTAsset(LocalR1000AssetId, 'R1000', 'R1000', 9, false)
export const LocalR10Asset = new JNTAsset(LocalR10AssetId, 'R10', 'R10', 9, false)
// JUNE is omitted here because it should be registered by default as the chain asset
const jntAssets: JNTAsset[] = [
  LocalETH1Asset,
  LocalMBTC1Asset,
  LocalDOGE1Asset,
  LocalUSDT1Asset,
  LocalDAI1Asset,
  LocalEUROC1Asset,
  LocalLTC1Asset,
  LocalXLM1Asset,
  LocalBCH1Asset,
  LocalPAXG1Asset,
  LocalXSGD1Asset,
  LocalETC1Asset,
  LocalR1000Asset,
  LocalR10Asset
]

export const LocalPlatformChain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  LocalJUNEAsset,
  LocalStakeConfig,
  LocalRewardConfig,
  ['P'],
  jntAssets
)
export const LocalJVMChain = new JVMBlockchain(
  'JVM-Chain',
  '2b67xnViKRFPTLHjhaaeTFsDWbWo3q8ASS631ztvyWoc316RUL',
  LocalJUNEAsset,
  ['JVM'],
  jntAssets
)
export const LocalJUNEChain = new JEVMBlockchain(
  'JUNE-Chain',
  '2rwGLc5X9zRricpnnHyQnT56ytfBVKG1h2QFnGJGYz85xy38aE',
  new JEVMGasToken(LocalJUNEAsset),
  BigInt(200001),
  BigInt('0'),
  LocalAddress,
  ['JUNE']
)

export const LocalETH1Chain = new JEVMBlockchain(
  'ETH1-Chain',
  'kYHGpm2VVjZUM7pqBesaHZRJBhHdC9QRj9Nd9VyBDzbRyGogC',
  new JEVMGasToken(LocalETH1Asset),
  BigInt(200002),
  BigInt('0'),
  LocalAddress,
  ['ETH1'],
  [LocalJUNEAsset]
)
export const LocalMBTC1Chain = new JEVMBlockchain(
  'mBTC1-Chain',
  'fRpR8iBy97PXeugvbXpYxnLZFJn7sy6fUQs6ZNp7KU6VNDaCn',
  new JEVMGasToken(LocalMBTC1Asset),
  BigInt(200003),
  BigInt('0'),
  LocalAddress,
  ['mBTC1'],
  [LocalJUNEAsset]
)
export const LocalDOGE1Chain = new JEVMBlockchain(
  'DOGE1-Chain',
  '2rn6KpgRBfnJ7WKhgP5JCGwAMmUs1bLnpsYLaip2dEu3nhAM4W',
  new JEVMGasToken(LocalDOGE1Asset),
  BigInt(200004),
  BigInt('0'),
  LocalAddress,
  ['DOGE1'],
  [LocalJUNEAsset]
)
export const LocalUSDT1Chain = new JEVMBlockchain(
  'USDT1-Chain',
  'eKSKvEaeMMY6giRENQ473gDXFsEBYbPedrtv7yeJBnXNyYpmV',
  new JEVMGasToken(LocalUSDT1Asset),
  BigInt(200006),
  BigInt('0'),
  LocalAddress,
  ['USDT1'],
  [LocalJUNEAsset]
)
export const LocalDAI1Chain = new JEVMBlockchain(
  'DAI1-Chain',
  '29rRiNoArirgpxui3L6YYtLJwAKkXRhEXHK75FouSAjqZwvT22',
  new JEVMGasToken(LocalDAI1Asset),
  BigInt(200007),
  BigInt('0'),
  LocalAddress,
  ['DAI1'],
  [LocalJUNEAsset]
)
export const LocalEUROC1Chain = new JEVMBlockchain(
  'EUROC1-Chain',
  'V8FXXAUXYm7AkXrRex7jrFvQ5ZnW9EeSeRwsWEYUqECZRPq8w',
  new JEVMGasToken(LocalEUROC1Asset),
  BigInt(200008),
  BigInt('0'),
  LocalAddress,
  ['EUROC1'],
  [LocalJUNEAsset]
)
export const LocalLTC1Chain = new JEVMBlockchain(
  'LTC1-Chain',
  'A8h2bUcXvRhy39CwTSqfMgJr3mxSHvbk3r1opqFgSp9mj8rEA',
  new JEVMGasToken(LocalLTC1Asset),
  BigInt(200009),
  BigInt('0'),
  LocalAddress,
  ['LTC1'],
  [LocalJUNEAsset]
)
export const LocalXLM1Chain = new JEVMBlockchain(
  'XLM1-Chain',
  '2GVXieb3jVY159xE59NyjNWymzaqJsy6ARsXxBbDz4sbSeqkUh',
  new JEVMGasToken(LocalXLM1Asset),
  BigInt(200010),
  BigInt('0'),
  LocalAddress,
  ['XLM1'],
  [LocalJUNEAsset]
)
export const LocalBCH1Chain = new JEVMBlockchain(
  'BCH1-Chain',
  'vdBEzHtv4chmKK9bm2utMpCWnXtGygygwSLB6GAdCVwuuFeNb',
  new JEVMGasToken(LocalBCH1Asset),
  BigInt(200011),
  BigInt('0'),
  LocalAddress,
  ['BCH1'],
  [LocalJUNEAsset]
)
export const LocalPAXG1Chain = new JEVMBlockchain(
  'PAXG1-Chain',
  'QPQgkxtfx3QkRydNXri8LVcYKh9R3Y5Z2TnA2GbjpxVHxFuzi',
  new JEVMGasToken(LocalPAXG1Asset),
  BigInt(200012),
  BigInt('0'),
  LocalAddress,
  ['PAXG1'],
  [LocalJUNEAsset]
)
export const LocalXSGD1Chain = new JEVMBlockchain(
  'XSGD1-Chain',
  'T4JgH3Mso84HrNN78ytM71kdfKsxDjt27fkdTRFC6nXfwwtLQ',
  new JEVMGasToken(LocalXSGD1Asset),
  BigInt(200015),
  BigInt('0'),
  LocalAddress,
  ['XSGD1'],
  [LocalJUNEAsset]
)
export const LocalETC1Chain = new JEVMBlockchain(
  'ETC1-Chain',
  's4WgDnS3qmNTY9NQQWcbE1AULLgdmHjnj3fDBjBdqhMAxjtcU',
  new JEVMGasToken(LocalETC1Asset),
  BigInt(200016),
  BigInt('0'),
  LocalAddress,
  ['ETC1'],
  [LocalJUNEAsset]
)
export const LocalR1000Chain = new JEVMBlockchain(
  'R1000-Chain',
  '2CyecVstLCni9ccdRmkuYRGYprFeQGMmbXz5XwZK4ufi3WN1bE',
  new JEVMGasToken(LocalR1000Asset),
  BigInt(200017),
  BigInt('0'),
  LocalAddress,
  ['R1000'],
  [LocalJUNEAsset]
)
export const LocalR10Chain = new JEVMBlockchain(
  'R10-Chain',
  'p24EfTFS6KScKDyPu1g9o14gDVcVqu6a2yAYn2LC6X6pMod8H',
  new JEVMGasToken(LocalR10Asset),
  BigInt(200018),
  BigInt('0'),
  LocalAddress,
  ['R10'],
  [LocalJUNEAsset]
)

export const LocalPrimarySupernet = new PrimarySupernet(
  '11111111111111111111111111111111LpoYY',
  [
    LocalPlatformChain,
    LocalJVMChain,
    LocalJUNEChain,
    LocalETH1Chain,
    LocalMBTC1Chain,
    LocalDOGE1Chain,
    LocalUSDT1Chain,
    LocalDAI1Chain,
    LocalEUROC1Chain,
    LocalLTC1Chain,
    LocalXLM1Chain,
    LocalBCH1Chain,
    LocalPAXG1Chain,
    LocalXSGD1Chain,
    LocalETC1Chain,
    LocalR1000Chain,
    LocalR10Chain
  ],
  LocalPlatformChain,
  LocalJVMChain,
  LocalJUNEChain
)

export const LocalNetwork = new MCN(LocalNetworkName, LocalAddress, LocalNetworkId, LocalHrp, LocalPrimarySupernet)
