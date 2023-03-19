import { JEVMBlockchain, JVMBlockchain, MCN, RelayBlockchain, Supernet } from './chain'
import * as params from './chain/params'

export * as api from './api'
export * as chain from './chain'
export * as utils from './utils'
export * as wallet from './wallet'

export const RelayChain: RelayBlockchain = new RelayBlockchain()
export const JVMChain: JVMBlockchain = new JVMBlockchain('JVM Chain', params.JVM_CHAIN_ID, params.JUNE_ASSET_ID, params.JVM_CHAIN_ALIASES)
export const JUNEChain: JEVMBlockchain = new JEVMBlockchain('JUNE Chain', params.JUNE_CHAIN_ID, params.JUNE_ASSET_ID, params.JUNE_CHAIN_EVM_ID, params.JUNE_CHAIN_ALIASES)

export const PrimarySupernet: Supernet = new Supernet(params.PRIMARY_SUPERNET_ID, [
  RelayChain,
  JVMChain,
  JUNEChain
])

export const Belgrade: MCN = new MCN(1, 'june', [PrimarySupernet])
