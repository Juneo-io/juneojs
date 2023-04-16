import { JRC20ContractAdapter } from '../solidity'
import { RelayBlockchain, JVMBlockchain, JEVMBlockchain } from './chain'
import { MCN, PrimarySupernet, StakeConfig } from './network'

export const NativeAssetBalanceContract: string = '0x0100000000000000000000000000000000000001'
export const NativeAssetCallContract: string = '0x0100000000000000000000000000000000000002'

export const BelgradeJUNEAssetId: string = 'dcND1oFSYQBKvLhsfJgFnLPnKuWntXY34GQdYRffThZbfZ7JD'
export const BelgradeUSDC1AssetId: string = 'f2aFbTdjMLPeLTbi8EzqjJwx95zF9jhdG4zQ6JWRgTAmihCZv'
export const BelgradeBUSD1AssetId: string = '2h4isjyZaNpKf5qFt5gBfAZGXcWRVgUqVaNYE9LRFNrF4rqKwx'
export const BelgradeEUROC1AssetId: string = '2dBT199DhU99qgohAbG1oYM9PuGoAy6xPpBJ4EUDhPpCKyF7n3'
export const BelgradePAXG1AssetId: string = 'XP39Jfa56x33U269ejiKgP6XZ5GXkMZX5m7ZR63u3gDSZVShs'
export const BelgradeMBTC1AssetId: string = 'tFA26E4syGj9KEyA3hZemp7qMaQ6KqBB4h4M4Y9xRmxQ18zuX'

const BelgradeAddress: string = 'https://api1.mcnpoc4.xyz:9650'
const RelayChainName: string = 'Relay-Chain'
const RelayChainId: string = '11111111111111111111111111111111LpoYY'
export const BelgradeRelayChain: RelayBlockchain = new RelayBlockchain(RelayChainName, RelayChainId, BelgradeJUNEAssetId, ['Relay'])
export const BelgradeJVMChain: JVMBlockchain = new JVMBlockchain('JVM-Chain', 'PMarXk9qgoRszKv5zLsH7F66m8FetM2AiUk2NjYcwTiZJ3S7q', BelgradeJUNEAssetId, ['Asset'])
export const BelgradeJUNEChain: JEVMBlockchain = new JEVMBlockchain('JUNE-Chain', '21Fsdh9v1PGLey87GVLnkH89icNzLWrgn3CH1vL6Tb7J7hu5w5',
  BelgradeJUNEAssetId, BigInt(330001), BelgradeAddress, ['JUNE'], {
    f2aFbTdjMLPeLTbi8EzqjJwx95zF9jhdG4zQ6JWRgTAmihCZv: '0x2d00000000000000000000000000000000000000',
    '2h4isjyZaNpKf5qFt5gBfAZGXcWRVgUqVaNYE9LRFNrF4rqKwx': '0x2e00000000000000000000000000000000000000',
    '2dBT199DhU99qgohAbG1oYM9PuGoAy6xPpBJ4EUDhPpCKyF7n3': '0x2f00000000000000000000000000000000000000',
    XP39Jfa56x33U269ejiKgP6XZ5GXkMZX5m7ZR63u3gDSZVShs: '0x3000000000000000000000000000000000000000',
    tFA26E4syGj9KEyA3hZemp7qMaQ6KqBB4h4M4Y9xRmxQ18zuX: '0x3100000000000000000000000000000000000000'
  }
)
BelgradeJUNEChain.contractHandler.registerAdapter(new JRC20ContractAdapter(BelgradeJUNEChain.ethProvider))
export const BelgradeUSDC1Chain: JEVMBlockchain = new JEVMBlockchain('USDC1-Chain', '2q7wRN9B835BxcpkAtiyaYqF9SDrKY9wPmkq6osNjxrTccZViq',
  BelgradeUSDC1AssetId, BigInt(330002), BelgradeAddress, ['USDC1'])
export const BelgradeBUSD1Chain: JEVMBlockchain = new JEVMBlockchain('BUSD1-Chain', '2Pg3FsDKyPKTMH179zN6vQN9248gqcqLAx2dvasxjqKZ8oCePX',
  BelgradeBUSD1AssetId, BigInt(330003), BelgradeAddress, ['BUSD1'])
export const BelgradeEUROC1Chain: JEVMBlockchain = new JEVMBlockchain('EUROC1-Chain', 'v1Kt7z7GAjsfJzHF7r2UPXWCpEF6U7wQaGmKyzHSBZeYmpCvH',
  BelgradeEUROC1AssetId, BigInt(330004), BelgradeAddress, ['EUROC1'])
export const BelgradePAXG1Chain: JEVMBlockchain = new JEVMBlockchain('PAXG1-Chain', 'r3YpRNgLLXJBPbihK23us9MnJ3Jcncz2gCUbuzWrw1LyhtFBD',
  BelgradePAXG1AssetId, BigInt(330005), BelgradeAddress, ['PAXG1'])
export const BelgradeMBTC1Chain: JEVMBlockchain = new JEVMBlockchain('mBTC1-Chain', 'uvSeFKmQG1H7J1Zd4obsdqr2YNEtR397htc6pVUZdHFnkoEf5',
  BelgradeMBTC1AssetId, BigInt(330006), BelgradeAddress, ['mBTC1'])

export const BelgradePrimarySupernet: PrimarySupernet = new PrimarySupernet('11111111111111111111111111111111LpoYY',
  [BelgradeRelayChain, BelgradeJVMChain, BelgradeJUNEChain, BelgradeUSDC1Chain, BelgradeBUSD1Chain, BelgradeEUROC1Chain, BelgradePAXG1Chain, BelgradeMBTC1Chain],
  BelgradeRelayChain, BelgradeJVMChain
)

export const BelgradeStakeConfig: StakeConfig = new StakeConfig(
  // 80%, 100, 45000, 0.01, 14 days, 365 days
  0.8, 100_000000000, 45000_000000000, 10000000, 2 * 7 * 24 * 3600, 365 * 24 * 3600
)

export const BelgradeNetwork: MCN = new MCN(BelgradeAddress, 1, 'june', BelgradeStakeConfig, BelgradePrimarySupernet)
// TODO Update when testnet is online
export const TestNetwork: MCN = BelgradeNetwork
// TODO Update when mainnet is online
export const MainNetwork: MCN = TestNetwork
