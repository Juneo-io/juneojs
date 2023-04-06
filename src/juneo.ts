import { JuneoClient, InfoAPI } from './api'
import { type GetTxFeeResponse } from './api/info/data'
import { JEVMAPI } from './api/jevm'
import { JVMAPI } from './api/jvm'
import { RelayAPI } from './api/relay'
import { JEVM_ID, type Supernet, type MCN, type Blockchain, type JEVMBlockchain } from './chain'
import * as params from './chain/params'

export class MCNProvider {
  mcn: MCN
  info: InfoAPI
  private feesCache: GetTxFeeResponse | undefined
  relay: RelayAPI
  jvm: JVMAPI
  jevm: Record<string, JEVMAPI> = {}

  constructor (mcn?: MCN, client?: JuneoClient) {
    if (mcn === undefined) {
      this.mcn = params.BelgradeNetwork
    } else {
      this.mcn = mcn
    }
    if (client === undefined) {
      client = JuneoClient.parse(this.mcn.address)
    }
    this.info = new InfoAPI(client)
    this.relay = new RelayAPI(client, this.mcn.primary.relay)
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

  async getFees (forceUpdate?: boolean): Promise<GetTxFeeResponse> {
    // explicit boolean comparison to cover undefined case
    if (forceUpdate === false && this.feesCache !== undefined) {
      return this.feesCache
    }
    this.feesCache = await this.info.getTxFee()
    return this.feesCache
  }

  clearCaches (): void {
    this.feesCache = undefined
  }
}

export * as api from './api'
export * as chain from './chain'
export * as transaction from './transaction'
export * as utils from './utils'

export { JuneoWallet, JVMWallet, JEVMWallet } from './wallet'
