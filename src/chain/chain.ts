import { ChainError } from '../utils'
import { type MCNProvider } from '../juneo'
import { type TokenAsset } from '../asset'

export interface Blockchain {
  name: string
  id: string
  vmId: string
  asset: TokenAsset
  assetId: string
  aliases: string[]
  registeredAssets: TokenAsset[]

  getAsset: (assetId: string) => TokenAsset

  validateAddress: (address: string, hrp?: string) => boolean

  validateAssetId: (provider: MCNProvider, assetId: string) => Promise<boolean>
}

export abstract class AbstractBlockchain implements Blockchain {
  name: string
  id: string
  vmId: string
  asset: TokenAsset
  assetId: string
  aliases: string[]
  registeredAssets: TokenAsset[]

  constructor (
    name: string,
    id: string,
    vmId: string,
    asset: TokenAsset,
    aliases: string[] = [],
    registeredAssets: TokenAsset[] = []
  ) {
    this.name = name
    this.id = id
    this.vmId = vmId
    this.asset = asset
    this.assetId = asset.assetId
    this.aliases = aliases
    this.registeredAssets = registeredAssets
    this.registerAssets([asset])
  }

  registerAssets (assets: TokenAsset[]): void {
    this.registeredAssets.push(...assets)
  }

  getAsset (assetId: string): TokenAsset {
    for (let i = 0; i < this.registeredAssets.length; i++) {
      const asset: TokenAsset = this.registeredAssets[i]
      if (assetId === asset.assetId) {
        return asset
      }
    }
    throw new ChainError(`unregistered asset id: ${assetId}`)
  }

  abstract validateAddress (address: string, hrp?: string): boolean

  abstract validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean>
}
