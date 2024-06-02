import { HttpProtocol, InfoAPI, JEVMAPI, JuneoClient, JVMAPI, PlatformAPI } from './api'
import { JEVM_ID, type JEVMBlockchain, type JVMBlockchain, type PlatformBlockchain } from './chain'
import { SocotraNetwork, type MCN } from './network'

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

  constructor (mcn: MCN = SocotraNetwork, client: JuneoClient = JuneoClient.parse(mcn.url)) {
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
        if (chain.vm.id === JEVM_ID) {
          this.jevmApi[chain.id] = new JEVMAPI(client, chain as JEVMBlockchain)
        }
      }
    }
    this.juneAssetId = this.platformChain.assetId
  }

  /**
   * Get a provider that uses one same node only. Load balanced requests could cause issues in some cases.
   * @param protocol The protocol that the provider should use. Defaults to Http.
   * @param port The port that the provider should use. Defaults to 9650.
   * @returns MCNProvider connecting with the ip address of one node.
   */
  async getStaticProvider (protocol: string = HttpProtocol, port: number = 9650): Promise<MCNProvider> {
    return this
    // const ip: string = (await this.info.getNodeIP()).ip.split(':')[0]
    // const client: JuneoClient = JuneoClient.parse(`${protocol}://${ip}:${port}`)
    // return new MCNProvider(this.mcn, client)
  }
}

export * from './api'
export * from './asset'
export * from './chain'
export * from './network'
export * from './transaction'
export * from './utils'
export * from './wallet'
