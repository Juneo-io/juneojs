import { fetchJNT, validateBech32 } from '../utils'
import { type TokenAsset, type JNTAsset } from '../asset'
import { AbstractBlockchain, VMAccountType } from './chain'
import { type MCNProvider } from '../juneo'

export const PLATFORMVM_ID: string = '11111111111111111111111111111111LpoYY'

export class PlatformBlockchain extends AbstractBlockchain {
  constructor (name: string, id: string, asset: JNTAsset, aliases?: string[], registeredAssets: TokenAsset[] = []) {
    super(name, id, PLATFORMVM_ID, VMAccountType.Utxo, asset, aliases, registeredAssets)
  }

  protected async fetchAsset (provider: MCNProvider, assetId: string): Promise<TokenAsset> {
    return await fetchJNT(provider, assetId)
  }

  validateAddress (address: string, hrp?: string): boolean {
    return validateBech32(address, hrp, this.aliases.concat(this.id))
  }
}
