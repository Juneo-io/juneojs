import { type JVMBlockchain, type RelayBlockchain, type Blockchain, type JEVMBlockchain } from './chain'

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
}

export class Supernet {
  id: string
  chains: Blockchain[]

  constructor (id: string, chains: Blockchain[]) {
    this.id = id
    this.chains = chains
  }
}

export class PrimarySupernet extends Supernet {
  relay: RelayBlockchain
  jvm: JVMBlockchain
  jevm: Record<string, JEVMBlockchain> = {}

  constructor (id: string, chains: Blockchain[], relay: RelayBlockchain, jvm: JVMBlockchain, jevm: JEVMBlockchain[]) {
    super(id, chains)
    this.relay = relay
    this.jvm = jvm
    jevm.forEach(vm => {
      this.jevm[vm.id] = vm
    })
  }
}
