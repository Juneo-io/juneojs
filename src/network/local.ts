import { JNTAsset, JEVMGasToken } from '../asset'
import { PlatformBlockchain, JVMBlockchain, JEVMBlockchain } from '../chain'
import { PrimarySupernet, StakeConfig, MCN } from './network'

const LocalNetworkId: number = 12345
const LocalHrp: string = 'local'
const LocalStakeConfig: StakeConfig = new StakeConfig(
  // 80%, 1, 100000, 0.01, 1 day, 365 days
  0.8,
  BigInt(1_000000000),
  BigInt(1_000_000_000000000),
  BigInt(1_0000000),
  BigInt(24 * 3600),
  BigInt(365 * 24 * 3600)
)
const LocalAddress: string = 'http://127.0.0.1:9650'

export const LocalJUNEAssetId: string = ''
export const LocalETH1AssetId: string = ''
export const LocalMBTC1AssetId: string = ''
export const LocalDOGE1AssetId: string = ''
export const LocalUSDT1AssetId: string = ''
export const LocalDAI1AssetId: string = ''
export const LocalEUROC1AssetId: string = ''
export const LocalLTC1AssetId: string = ''
export const LocalXLM1AssetId: string = ''
export const LocalBCH1AssetId: string = ''
export const LocalPAXG1AssetId: string = ''
export const LocalXSGD1AssetId: string = ''
export const LocalETC1AssetId: string = ''
export const LocalR1000AssetId: string = ''
export const LocalR10AssetId: string = ''

export const LocalJUNEAsset: JNTAsset = new JNTAsset(LocalJUNEAssetId, 'JUNE', 'JUNE', 9, false)
export const LocalETH1Asset: JNTAsset = new JNTAsset(LocalETH1AssetId, 'ETH1', 'ETH1', 9, false)
export const LocalMBTC1Asset: JNTAsset = new JNTAsset(LocalMBTC1AssetId, 'mBTC1', 'mBTC1', 9, false)
export const LocalDOGE1Asset: JNTAsset = new JNTAsset(LocalDOGE1AssetId, 'DOGE1', 'DOGE1', 9, false)
export const LocalUSDT1Asset: JNTAsset = new JNTAsset(LocalUSDT1AssetId, 'USDT1', 'USDT1', 9, false)
export const LocalDAI1Asset: JNTAsset = new JNTAsset(LocalDAI1AssetId, 'DAI1', 'DAI1', 9, false)
export const LocalEUROC1Asset: JNTAsset = new JNTAsset(LocalEUROC1AssetId, 'EUROC1', 'EUROC1', 9, false)
export const LocalLTC1Asset: JNTAsset = new JNTAsset(LocalLTC1AssetId, 'LTC1', 'LTC1', 9, false)
export const LocalXLM1Asset: JNTAsset = new JNTAsset(LocalXLM1AssetId, 'XLM1', 'XLM1', 9, false)
export const LocalBCH1Asset: JNTAsset = new JNTAsset(LocalBCH1AssetId, 'BCH1', 'BCH1', 9, false)
export const LocalPAXG1Asset: JNTAsset = new JNTAsset(LocalPAXG1AssetId, 'PAXG1', 'PAXG1', 9, false)
export const LocalXSGD1Asset: JNTAsset = new JNTAsset(LocalXSGD1AssetId, 'XSGD1', 'XSGD1', 9, false)
export const LocalETC1Asset: JNTAsset = new JNTAsset(LocalETC1AssetId, 'ETC1', 'ETC1', 9, false)
export const LocalR1000Asset: JNTAsset = new JNTAsset(LocalR1000AssetId, 'R1000', 'R1000', 9, false)
export const LocalR10Asset: JNTAsset = new JNTAsset(LocalR10AssetId, 'R10', 'R10', 9, false)
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

export const LocalPlatformChain: PlatformBlockchain = new PlatformBlockchain(
  'Platform-Chain',
  '11111111111111111111111111111111LpoYY',
  LocalJUNEAsset,
  ['P'],
  jntAssets
)
export const LocalJVMChain: JVMBlockchain = new JVMBlockchain('JVM-Chain', '', LocalJUNEAsset, ['JVM'], jntAssets)
export const LocalJUNEChain: JEVMBlockchain = new JEVMBlockchain(
  'JUNE-Chain',
  '',
  new JEVMGasToken(LocalJUNEAsset),
  BigInt(200001),
  BigInt('0'),
  LocalAddress,
  ['JUNE']
)

export const LocalETH1Chain: JEVMBlockchain = new JEVMBlockchain(
  'ETH1-Chain',
  '',
  new JEVMGasToken(LocalETH1Asset),
  BigInt(200002),
  BigInt('0'),
  LocalAddress,
  ['ETH1'],
  [LocalJUNEAsset]
)
export const LocalMBTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'mBTC1-Chain',
  '',
  new JEVMGasToken(LocalMBTC1Asset),
  BigInt(200003),
  BigInt('0'),
  LocalAddress,
  ['mBTC1'],
  [LocalJUNEAsset]
)
export const LocalDOGE1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DOGE1-Chain',
  '',
  new JEVMGasToken(LocalDOGE1Asset),
  BigInt(200004),
  BigInt('0'),
  LocalAddress,
  ['DOGE1'],
  [LocalJUNEAsset]
)
export const LocalUSDT1Chain: JEVMBlockchain = new JEVMBlockchain(
  'USDT1-Chain',
  '',
  new JEVMGasToken(LocalUSDT1Asset),
  BigInt(200006),
  BigInt('0'),
  LocalAddress,
  ['USDT1'],
  [LocalJUNEAsset]
)
export const LocalDAI1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DAI1-Chain',
  '',
  new JEVMGasToken(LocalDAI1Asset),
  BigInt(200007),
  BigInt('0'),
  LocalAddress,
  ['DAI1'],
  [LocalJUNEAsset]
)
export const LocalEUROC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'EUROC1-Chain',
  '',
  new JEVMGasToken(LocalEUROC1Asset),
  BigInt(200008),
  BigInt('0'),
  LocalAddress,
  ['EUROC1'],
  [LocalJUNEAsset]
)
export const LocalLTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'LTC1-Chain',
  '',
  new JEVMGasToken(LocalLTC1Asset),
  BigInt(200009),
  BigInt('0'),
  LocalAddress,
  ['LTC1'],
  [LocalJUNEAsset]
)
export const LocalXLM1Chain: JEVMBlockchain = new JEVMBlockchain(
  'XLM1-Chain',
  '',
  new JEVMGasToken(LocalXLM1Asset),
  BigInt(200010),
  BigInt('0'),
  LocalAddress,
  ['XLM1'],
  [LocalJUNEAsset]
)
export const LocalBCH1Chain: JEVMBlockchain = new JEVMBlockchain(
  'BCH1-Chain',
  '',
  new JEVMGasToken(LocalBCH1Asset),
  BigInt(200011),
  BigInt('0'),
  LocalAddress,
  ['BCH1'],
  [LocalJUNEAsset]
)
export const LocalPAXG1Chain: JEVMBlockchain = new JEVMBlockchain(
  'PAXG1-Chain',
  '',
  new JEVMGasToken(LocalPAXG1Asset),
  BigInt(200012),
  BigInt('0'),
  LocalAddress,
  ['PAXG1'],
  [LocalJUNEAsset]
)
export const LocalXSGD1Chain: JEVMBlockchain = new JEVMBlockchain(
  'XSGD1-Chain',
  '',
  new JEVMGasToken(LocalXSGD1Asset),
  BigInt(200015),
  BigInt('0'),
  LocalAddress,
  ['XSGD1'],
  [LocalJUNEAsset]
)
export const LocalETC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'ETC1-Chain',
  '',
  new JEVMGasToken(LocalETC1Asset),
  BigInt(200016),
  BigInt('0'),
  LocalAddress,
  ['ETC1'],
  [LocalJUNEAsset]
)
export const LocalR1000Chain: JEVMBlockchain = new JEVMBlockchain(
  'R1000-Chain',
  '',
  new JEVMGasToken(LocalR1000Asset),
  BigInt(200017),
  BigInt('0'),
  LocalAddress,
  ['R1000'],
  [LocalJUNEAsset]
)
export const LocalR10Chain: JEVMBlockchain = new JEVMBlockchain(
  'R10-Chain',
  '',
  new JEVMGasToken(LocalR10Asset),
  BigInt(200018),
  BigInt('0'),
  LocalAddress,
  ['R10'],
  [LocalJUNEAsset]
)

export const LocalPrimarySupernet: PrimarySupernet = new PrimarySupernet(
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
  LocalJVMChain
)

export const LocalNetwork: MCN = new MCN(LocalAddress, LocalNetworkId, LocalHrp, LocalStakeConfig, LocalPrimarySupernet)
