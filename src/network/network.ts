import { type Blockchain, type PlatformBlockchain, type JVMBlockchain, type JEVMBlockchain } from '../chain'

export class MCN {
  url: string
  id: number
  hrp: string
  stakeConfig: StakeConfig
  primary: PrimarySupernet
  supernets: Supernet[]

  constructor (
    url: string,
    id: number,
    hrp: string,
    stakeConfig: StakeConfig,
    primary: PrimarySupernet,
    supernets: Supernet[] = [primary]
  ) {
    this.url = url
    this.id = id
    this.hrp = hrp
    this.stakeConfig = stakeConfig
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
