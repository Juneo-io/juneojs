import { type JVMBlockchain, type RelayBlockchain, type Blockchain } from './chain'

export class MCN {
  address: string
  id: number
  hrp: string
  primary: PrimarySupernet
  supernets: Supernet[]

  constructor (address: string, id: number, hrp: string, primary: PrimarySupernet, supernets?: Supernet[]) {
    this.address = address
    this.id = id
    this.hrp = hrp
    this.primary = primary
    if (supernets === undefined) {
      this.supernets = [this.primary]
    } else {
      this.supernets = supernets
    }
  }

  getChain (chainId: string): Blockchain | undefined {
    for (let i: number = 0; i < this.supernets.length; i++) {
      const supernet: Supernet = this.supernets[i]
      const chain: Blockchain | undefined = supernet.getChain(chainId)
      if (chain !== undefined) {
        return chain
      }
    }
    return undefined
  }
}

export class Supernet {
  id: string
  chains: Blockchain[]

  constructor (id: string, chains: Blockchain[]) {
    this.id = id
    this.chains = chains
  }

  getChain (chainId: string): Blockchain | undefined {
    for (let i: number = 0; i < this.chains.length; i++) {
      const chain: Blockchain = this.chains[i]
      if (chain.id === chainId) {
        return chain
      }
    }
    return undefined
  }
}

export class PrimarySupernet extends Supernet {
  relay: RelayBlockchain
  jvm: JVMBlockchain

  constructor (id: string, chains: Blockchain[], relay: RelayBlockchain, jvm: JVMBlockchain) {
    super(id, chains)
    this.relay = relay
    this.jvm = jvm
  }
}
