import { type Blockchain, type PlatformBlockchain, type JVMBlockchain } from '../chain'

export class MCN {
  address: string
  id: number
  hrp: string
  stakeConfig: StakeConfig
  primary: PrimarySupernet
  supernets: Supernet[]

  constructor (
    address: string,
    id: number,
    hrp: string,
    stakeConfig: StakeConfig,
    primary: PrimarySupernet,
    supernets: Supernet[] = [primary]
  ) {
    this.address = address
    this.id = id
    this.hrp = hrp
    this.stakeConfig = stakeConfig
    this.primary = primary
    this.supernets = supernets
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

export class StakeConfig {
  uptimeRequirement: number
  minValidatorStake: bigint
  maxValidatorStake: bigint
  minDelegatorStake: bigint
  minStakeDuration: bigint
  maxStakeDuration: bigint

  constructor (
    uptimeRequirement: number,
    minValidatorStake: bigint,
    maxValidatorStake: bigint,
    minDelegatorStake: bigint,
    minStakeDuration: bigint,
    maxStakeDuration: bigint
  ) {
    this.uptimeRequirement = uptimeRequirement
    this.minValidatorStake = minValidatorStake
    this.maxValidatorStake = maxValidatorStake
    this.minDelegatorStake = minDelegatorStake
    this.minStakeDuration = minStakeDuration
    this.maxStakeDuration = maxStakeDuration
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
  platform: PlatformBlockchain
  jvm: JVMBlockchain

  constructor (id: string, chains: Blockchain[], platform: PlatformBlockchain, jvm: JVMBlockchain) {
    super(id, chains)
    this.platform = platform
    this.jvm = jvm
  }
}