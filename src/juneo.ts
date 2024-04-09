import { InfoAPI, PlatformAPI, JVMAPI, JEVMAPI, JuneoClient } from './api'
import { JEVM_ID, type JEVMBlockchain } from './chain'
import { type MCN, GenesisNetwork } from './network'

export class MCNProvider {
  mcn: MCN
  client: JuneoClient
  info: InfoAPI
  platform: PlatformAPI
  jvm: JVMAPI
  june: JEVMAPI
  jevm: Record<string, JEVMAPI> = {}

  constructor (mcn: MCN = GenesisNetwork, client: JuneoClient = JuneoClient.parse(mcn.address)) {
    this.mcn = mcn
    this.client = client
    this.info = new InfoAPI(client)
    this.platform = new PlatformAPI(client, this.mcn.primary.platform)
    this.jvm = new JVMAPI(client, this.mcn.primary.jvm)
    this.june = new JEVMAPI(client, this.mcn.primary.june)
    this.jevm[this.mcn.primary.june.id] = this.june
    for (const supernet of this.mcn.supernets) {
      for (const chain of supernet.chains) {
        if (chain.vmId !== JEVM_ID) {
          continue
        }
        if (chain.id !== this.mcn.primary.june.id) {
          this.jevm[chain.id] = new JEVMAPI(client, chain as JEVMBlockchain)
        }
      }
    }
  }
}

export * from './api'
export * from './asset'
export * from './chain'
export * from './network'
export * from './transaction'
export * from './utils'
export * from './wallet'
