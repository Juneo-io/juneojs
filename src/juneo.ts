import { InfoAPI, PlatformAPI, JVMAPI, JEVMAPI, JuneoClient } from './api'
import { type Blockchain, JEVM_ID, type JEVMBlockchain } from './chain'
import { type MCN, SocotraNetwork, type Supernet } from './network'

export class MCNProvider {
  mcn: MCN
  info: InfoAPI
  platform: PlatformAPI
  jvm: JVMAPI
  jevm: Record<string, JEVMAPI> = {}

  constructor (mcn: MCN = SocotraNetwork, client: JuneoClient = JuneoClient.parse(mcn.address)) {
    this.mcn = mcn
    this.info = new InfoAPI(client)
    this.platform = new PlatformAPI(client, this.mcn.primary.platform)
    this.jvm = new JVMAPI(client, this.mcn.primary.jvm)
    for (let i: number = 0; i < this.mcn.supernets.length; i++) {
      const supernet: Supernet = this.mcn.supernets[i]
      for (let j: number = 0; j < supernet.chains.length; j++) {
        const chain: Blockchain = supernet.chains[j]
        if (chain.vmId === JEVM_ID) {
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
