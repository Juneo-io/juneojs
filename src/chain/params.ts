import { RelayBlockchain, JVMBlockchain, JEVMBlockchain } from './chain'
import { Supernet, MCN } from './network'

export const RELAYVM_ID: string = '11111111111111111111111111111111LpoYY'
export const JVM_ID: string = 'otSmSxFRBqdRX7kestRW732n3WS2MrLAoWwHZxHnmMGMuLYX8'
export const JEVM_ID: string = 'mgj786NP7uDwBCcq6YwThhaN8FLyybkCa4zBWTQbNgmK6k9A6'

export const BelgradeJUNEAssetId: string = 'dcND1oFSYQBKvLhsfJgFnLPnKuWntXY34GQdYRffThZbfZ7JD'

export const BelgradeRelayChain: RelayBlockchain = new RelayBlockchain(
  BelgradeJUNEAssetId,
  ['Relay'])
export const BelgradeJVMChain: JVMBlockchain = new JVMBlockchain(
  'JVM Chain',
  'PMarXk9qgoRszKv5zLsH7F66m8FetM2AiUk2NjYcwTiZJ3S7q',
  BelgradeJUNEAssetId,
  ['Asset'])
export const BelgradeJUNEChain: JEVMBlockchain = new JEVMBlockchain(
  'JUNE Chain',
  '21Fsdh9v1PGLey87GVLnkH89icNzLWrgn3CH1vL6Tb7J7hu5w5',
  BelgradeJUNEAssetId,
  BigInt(330001),
  ['JUNE'])

export const BelgradePrimarySupernet: Supernet = new Supernet('11111111111111111111111111111111LpoYY', [
  BelgradeRelayChain,
  BelgradeJVMChain,
  BelgradeJUNEChain
])

export const BelgradeNetwork: MCN = new MCN(1, 'june', [BelgradePrimarySupernet])
// TODO Update when testnet is online
export const TestNetwork: MCN = BelgradeNetwork
// TODO Update when mainnet is online
export const MainNetwork: MCN = TestNetwork
