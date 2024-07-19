import { type Blockchain, type JEVMBlockchain, type JVMBlockchain, type PlatformBlockchain } from '../chain'
import { MCNWallet } from '../wallet'

const PrimarySupernetName = 'Primary Supernet'

export class MCN {
  name: string
  url: string
  id: number
  hrp: string
  primary: PrimarySupernet
  supernets: Supernet[]

  constructor (
    name: string,
    url: string,
    id: number,
    hrp: string,
    primary: PrimarySupernet,
    supernets: Supernet[] = [primary]
  ) {
    this.name = name
    this.url = url
    this.id = id
    this.hrp = hrp
    this.primary = primary
    this.supernets = supernets
  }

  recoverWallet (recoveryData: string): MCNWallet {
    return new MCNWallet(this.hrp, recoveryData)
  }

  generateWallet (wordsCount: number = 12): MCNWallet {
    return new MCNWallet(this.hrp, wordsCount)
  }

  getChain (chainId: string): Blockchain {
    for (const supernet of this.supernets) {
      const chain = supernet.getSupernetChain(chainId)
      if (chain !== undefined) {
        return chain
      }
    }
    throw new Error(`no registered chain with id ${chainId} in ${this.name}`)
  }
}

export class Supernet {
  name: string
  id: string
  chains: Blockchain[]

  constructor (name: string, id: string, chains: Blockchain[]) {
    this.name = name
    this.id = id
    this.chains = chains
  }

  getSupernetChain (chainId: string): Blockchain {
    for (const chain of this.chains) {
      if (chain.id === chainId) {
        return chain
      }
    }
    throw new Error(`no registered chain with id ${chainId} in supernet ${this.name}`)
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
    super(PrimarySupernetName, id, chains)
    this.platform = platform
    this.jvm = jvm
    this.june = june
  }
}
