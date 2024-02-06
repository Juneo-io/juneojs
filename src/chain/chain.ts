import { type TokenAsset } from '../asset'
import { type MCNProvider } from '../juneo'

export enum VMAccountType {
  Utxo = 'Utxo',
  Nonce = 'Nonce',
}

export interface Blockchain {
  name: string
  id: string
  vmId: string
  accountType: VMAccountType
  asset: TokenAsset
  assetId: string
  aliases: string[]

  getRegisteredAssets: () => IterableIterator<TokenAsset>

  addRegisteredAsset: (asset: TokenAsset) => void

  getAsset: (provider: MCNProvider, assetId: string) => Promise<TokenAsset>

  validateAddress: (address: string, hrp?: string) => boolean
}

export abstract class AbstractBlockchain implements Blockchain {
  name: string
  id: string
  vmId: string
  accountType: VMAccountType
  asset: TokenAsset
  assetId: string
  aliases: string[]
  registeredAssets = new Map<string, TokenAsset>()

  constructor (
    name: string,
    id: string,
    vmId: string,
    accountType: VMAccountType,
    asset: TokenAsset,
    aliases: string[] = [],
    registeredAssets: TokenAsset[] = []
  ) {
    this.name = name
    this.id = id
    this.vmId = vmId
    this.accountType = accountType
    this.asset = asset
    this.assetId = asset.assetId
    this.aliases = aliases
    for (const asset of registeredAssets) {
      this.addRegisteredAsset(asset)
    }
    this.addRegisteredAsset(asset)
  }

  getRegisteredAssets (): IterableIterator<TokenAsset> {
    return this.registeredAssets.values()
  }

  addRegisteredAsset (asset: TokenAsset): void {
    this.registeredAssets.set(asset.assetId, asset)
  }

  async getAsset (provider: MCNProvider, assetId: string): Promise<TokenAsset> {
    if (this.registeredAssets.has(assetId)) {
      return this.registeredAssets.get(assetId)!
    }
    const asset: TokenAsset = await this.fetchAsset(provider, assetId)
    this.addRegisteredAsset(asset)
    return asset
  }

  protected abstract fetchAsset (provider: MCNProvider, assetId: string): Promise<TokenAsset>

  abstract validateAddress (address: string, hrp?: string): boolean
}
