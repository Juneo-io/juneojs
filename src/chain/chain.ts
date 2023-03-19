import { type JuneoWallet, type VMWallet } from '../wallet'
import { type BN } from 'bn.js'
import * as params from './params'

export interface Blockchain {

  name: string
  id: string
  vmId: string
  assetId: string
  aliases: string[] | undefined

  buildWallet: (wallet: JuneoWallet) => VMWallet

}

export interface JEVMBlockchain {

  chainId: typeof BN

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
  constructor () {
    super(params.RELAY_CHAIN_NAME, params.RELAY_CHAIN_ID, params.RELAYVM_ID, params.JUNE_ASSET_ID, params.RELAY_CHAIN_ALIASES)
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
  chainId: typeof BN

  constructor (name: string, id: string, assetId: string, chainId: typeof BN, aliases?: string[]) {
    super(name, id, params.JEVM_ID, assetId, aliases)
    this.chainId = chainId
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJEVMWallet(this)
  }
}
