import { type Blockchain, type JEVMBlockchain, type JVMBlockchain, type PlatformBlockchain } from '../chain'

export class MCN {
  url: string
  id: number
  hrp: string
  primary: PrimarySupernet
  supernets: Supernet[]

  constructor (url: string, id: number, hrp: string, primary: PrimarySupernet, supernets: Supernet[] = [primary]) {
    this.url = url
    this.id = id
    this.hrp = hrp
    this.primary = primary
    this.supernets = supernets
  }

  getChain (chainId: string): Blockchain | undefined {
    for (const supernet of this.supernets) {
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
    for (const chain of this.chains) {
      if (chain.id === chainId) {
        return chain
      }
    }
    return undefined
  }
}

export class PrimarySupernet extends Supernet {
  platform: PlatformBlockchain
  jvm: JVMBlockchain
  june: JEVMBlockchain

  constructor (
    id: string,
    chains: Blockchain[],
    platform: PlatformBlockchain,
    jvm: JVMBlockchain,
    june: JEVMBlockchain
  ) {
    super(id, chains)
    this.platform = platform
    this.jvm = jvm
    this.june = june
  }
}
