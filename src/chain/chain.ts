import { MCNProvider } from '../juneo'
import { type JuneoWallet, type VMWallet } from '../wallet'

export const RELAYVM_ID: string = '11111111111111111111111111111111LpoYY'
export const JVM_ID: string = 'otSmSxFRBqdRX7kestRW732n3WS2MrLAoWwHZxHnmMGMuLYX8'
export const JEVM_ID: string = 'mgj786NP7uDwBCcq6YwThhaN8FLyybkCa4zBWTQbNgmK6k9A6'

const RELAY_CHAIN_NAME: string = 'Relay Chain'
const RELAY_CHAIN_ID: string = '11111111111111111111111111111111LpoYY'

export interface Blockchain {

  name: string
  id: string
  vmId: string
  assetId: string
  aliases: string[] | undefined

  buildWallet: (wallet: JuneoWallet) => VMWallet

}

export interface JEVMBlockchain {

  chainId: bigint

}

export abstract class AbstractBlockchain implements Blockchain {
  name: string
  id: string
  vmId: string
  assetId: string
  aliases: string[] | undefined

  constructor (name: string, id: string, vmId: string, assetId: string, aliases?: string[]) {
    this.name = name
    this.id = id
    this.vmId = vmId
    this.assetId = assetId
    this.aliases = aliases
  }

  abstract buildWallet (wallet: JuneoWallet): VMWallet
}

export class RelayBlockchain extends AbstractBlockchain {
  constructor (assetId: string, aliases?: string[]) {
    super(RELAY_CHAIN_NAME, RELAY_CHAIN_ID, RELAYVM_ID, assetId, aliases)
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJVMWallet(this)
  }
}

export class JVMBlockchain extends AbstractBlockchain {
  constructor (name: string, id: string, assetId: string, aliases?: string[]) {
    super(name, id, JVM_ID, assetId, aliases)
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJVMWallet(this)
  }
}

export class JEVMBlockchain extends AbstractBlockchain implements JEVMBlockchain {
  chainId: bigint

  constructor (name: string, id: string, assetId: string, chainId: bigint, aliases?: string[]) {
    super(name, id, JEVM_ID, assetId, aliases)
    this.chainId = chainId
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJEVMWallet(this)
  }
}
