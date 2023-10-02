import { validateBech32 } from '../utils'
import { type TokenAsset, type JNTAsset } from '../asset'
import { type MCNProvider } from '../juneo'
import { AbstractBlockchain } from './chain'
import { JVMBlockchain } from './jvm'

export const PLATFORMVM_ID: string = '11111111111111111111111111111111LpoYY'

export class PlatformBlockchain extends AbstractBlockchain {
  constructor (name: string, id: string, asset: JNTAsset, aliases?: string[], registeredAssets: TokenAsset[] = []) {
    super(name, id, PLATFORMVM_ID, asset, aliases, registeredAssets)
  }

  validateAddress (address: string, hrp?: string): boolean {
    return validateBech32(address, hrp, this.aliases.concat(this.id))
  }

  async validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean> {
    return await JVMBlockchain.validateJVMAssetId(provider, assetId)
  }
}
