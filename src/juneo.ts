import * as api from './api'
import { type JuneoClient, InfoAPI } from './api'
import { JVMAPI } from './api/jvm'
import { RelayAPI } from './api/relay'
import { JEVMBlockchain, JVMBlockchain, MCN, RelayBlockchain, Supernet } from './chain'
import * as params from './chain/params'

export const RelayChain: RelayBlockchain = new RelayBlockchain()
export const JVMChain: JVMBlockchain = new JVMBlockchain('JVM Chain', params.JVM_CHAIN_ID, params.JUNE_ASSET_ID, params.JVM_CHAIN_ALIASES)
export const JUNEChain: JEVMBlockchain = new JEVMBlockchain('JUNE Chain', params.JUNE_CHAIN_ID, params.JUNE_ASSET_ID, params.JUNE_CHAIN_EVM_ID, params.JUNE_CHAIN_ALIASES)

export const PrimarySupernet: Supernet = new Supernet(params.PRIMARY_SUPERNET_ID, [
  RelayChain,
  JVMChain,
  JUNEChain
])

export const Belgrade: MCN = new MCN(1, 'june', [PrimarySupernet])

export function buildProvider (address?: string): JuneoProvider {
  if (address === undefined) {
    return new JuneoProvider(api.buildClient())
  }
  return new JuneoProvider(api.buildClient(address))
}

export class JuneoProvider {
  info: InfoAPI
  relay: RelayAPI
  jvm: JVMAPI

  constructor (client: JuneoClient) {
    this.info = new InfoAPI(client)
    this.relay = new RelayAPI(client)
    this.jvm = new JVMAPI(client)
  }
}

export * as api from './api'
export * as chain from './chain'
export * as utils from './utils'

export { JuneoWallet, JVMWallet, JEVMWallet } from './wallet'
