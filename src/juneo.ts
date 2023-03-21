import { JuneoClient, InfoAPI } from './api'
import { JVMAPI } from './api/jvm'
import { RelayAPI } from './api/relay'
import * as params from './chain/params'

export class JuneoProvider {
  info: InfoAPI
  relay: RelayAPI
  jvm: JVMAPI

  constructor (client?: JuneoClient) {
    if (client === undefined) {
      client = new JuneoClient()
    }
    this.info = new InfoAPI(client)
    this.relay = new RelayAPI(client, params.BelgradeRelayChain)
    this.jvm = new JVMAPI(client, params.BelgradeJVMChain)
  }
}

export * as api from './api'
export * as chain from './chain'
export * as utils from './utils'

export { JuneoWallet, JVMWallet, JEVMWallet } from './wallet'
