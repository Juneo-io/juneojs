import { type JNTAsset, type TokenAsset } from '../asset'
import { type MCNProvider } from '../juneo'
import { fetchJNT, validateBech32 } from '../utils'
import { AbstractBlockchain } from './chain'
import { JVM_HD_PATH, JVM_ID } from './constants'
import { ChainVM, VMType, VMWalletType } from './vm'

export class JVMBlockchain extends AbstractBlockchain {
  constructor (name: string, id: string, asset: JNTAsset, aliases?: string[], registeredAssets: TokenAsset[] = []) {
    super(name, id, new ChainVM(JVM_ID, VMType.JVM, VMWalletType.Utxo, JVM_HD_PATH), asset, aliases, registeredAssets)
  }

  protected async fetchAsset (provider: MCNProvider, assetId: string): Promise<TokenAsset> {
    return await fetchJNT(provider, assetId)
  }

  validateAddress (address: string, hrp?: string): boolean {
    return validateBech32(address, hrp, this.aliases.concat(this.id))
  }
}
