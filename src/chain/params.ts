import { RelayBlockchain, JVMBlockchain, JEVMBlockchain } from './chain'
import { MCN, PrimarySupernet } from './network'

export const BelgradeJUNEAssetId: string = 'dcND1oFSYQBKvLhsfJgFnLPnKuWntXY34GQdYRffThZbfZ7JD'

export const BelgradeRelayChain: RelayBlockchain = new RelayBlockchain(
  BelgradeJUNEAssetId,
  ['Relay']
)
export const BelgradeJVMChain: JVMBlockchain = new JVMBlockchain(
  'JVM Chain',
  'PMarXk9qgoRszKv5zLsH7F66m8FetM2AiUk2NjYcwTiZJ3S7q',
  BelgradeJUNEAssetId,
  ['Asset']
)
export const BelgradeJUNEChain: JEVMBlockchain = new JEVMBlockchain(
  'JUNE Chain',
  '21Fsdh9v1PGLey87GVLnkH89icNzLWrgn3CH1vL6Tb7J7hu5w5',
  BelgradeJUNEAssetId,
  BigInt(330001),
  ['JUNE']
)

export const BelgradePrimarySupernet: PrimarySupernet =
new PrimarySupernet(
  '11111111111111111111111111111111LpoYY',
  [BelgradeRelayChain,
    BelgradeJVMChain,
    BelgradeJUNEChain],
  BelgradeRelayChain,
  BelgradeJVMChain
)

const BelgradeAddress: string = 'https://api1.mcnpoc4.xyz:9650'
export const BelgradeNetwork: MCN = new MCN(BelgradeAddress, 1, 'june', BelgradePrimarySupernet)
// TODO Update when testnet is online
export const TestNetwork: MCN = BelgradeNetwork
// TODO Update when mainnet is online
export const MainNetwork: MCN = TestNetwork
