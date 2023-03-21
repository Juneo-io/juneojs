import { type JuneoWallet, type VMWallet } from '../wallet'
import * as params from './params'

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

  chainId: number

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
  constructor (assetId: string) {
    super(RELAY_CHAIN_NAME, RELAY_CHAIN_ID, params.RELAYVM_ID, assetId)
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJVMWallet(this)
  }
}

export class JVMBlockchain extends AbstractBlockchain {
  constructor (name: string, id: string, assetId: string, aliases?: string[]) {
    super(name, id, params.JVM_ID, assetId, aliases)
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJVMWallet(this)
  }
}

export class JEVMBlockchain extends AbstractBlockchain implements JEVMBlockchain {
  chainId: number

  constructor (name: string, id: string, assetId: string, chainId: number, aliases?: string[]) {
    super(name, id, params.JEVM_ID, assetId, aliases)
    this.chainId = chainId
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJEVMWallet(this)
  }
}
