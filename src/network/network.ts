import { type Blockchain, type JEVMBlockchain, type JVMBlockchain, type PlatformBlockchain } from '../chain'

export class MCNAccess {
  url: string
  staticUrls: string[]

  constructor (url: string, staticUrls: string[] = []) {
    this.url = url
    this.staticUrls = staticUrls
  }

  getStaticUrl (): string {
    if (this.staticUrls.length < 1) {
      return this.url
    }
    const index = Math.floor(Math.random() * this.staticUrls.length)
    return this.staticUrls[index]
  }
}

export class MCN {
  access: MCNAccess
  id: number
  hrp: string
  primary: PrimarySupernet
  supernets: Supernet[]

  constructor (access: MCNAccess, id: number, hrp: string, primary: PrimarySupernet, supernets: Supernet[] = [primary]) {
    this.access = access
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
