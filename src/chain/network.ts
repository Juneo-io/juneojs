import { type Blockchain } from './chain'

export class MCN {
  id: number
  hrp: string
  supernets: Supernet[]

  constructor (id: number, hrp: string, supernets: Supernet[]) {
    this.id = id
    this.hrp = hrp
    this.supernets = supernets
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
