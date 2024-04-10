import { InfoAPI, PlatformAPI, JVMAPI, JEVMAPI, JuneoClient } from './api'
import { JEVM_ID, type JVMBlockchain, type PlatformBlockchain, type JEVMBlockchain } from './chain'
import { type MCN, GenesisNetwork } from './network'

export class MCNProvider {
  mcn: MCN
  client: JuneoClient
  info: InfoAPI
  platformChain: PlatformBlockchain
  platformApi: PlatformAPI
  jvmChain: JVMBlockchain
  jvmApi: JVMAPI
  juneChain: JEVMBlockchain
  juneApi: JEVMAPI
  jevmApi: Record<string, JEVMAPI> = {}
  juneAssetId: string

  constructor (mcn: MCN = GenesisNetwork, client: JuneoClient = JuneoClient.parse(mcn.url)) {
    this.mcn = mcn
    this.client = client
    this.info = new InfoAPI(client)
    this.platformChain = this.mcn.primary.platform
    this.platformApi = new PlatformAPI(client, this.platformChain)
    this.jvmChain = this.mcn.primary.jvm
    this.jvmApi = new JVMAPI(client, this.jvmChain)
    this.juneChain = this.mcn.primary.june
    this.juneApi = new JEVMAPI(client, this.juneChain)
    for (const supernet of this.mcn.supernets) {
      for (const chain of supernet.chains) {
        if (chain.vmId === JEVM_ID) {
          this.jevmApi[chain.id] = new JEVMAPI(client, chain as JEVMBlockchain)
        }
      }
    }
    this.juneAssetId = this.platformChain.assetId
  }
}

export * from './api'
export * from './asset'
export * from './chain'
export * from './network'
export * from './transaction'
export * from './utils'
export * from './wallet'
