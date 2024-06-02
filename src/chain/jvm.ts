import { type JNTAsset, type TokenAsset } from '../asset'
import { type MCNProvider } from '../juneo'
import { fetchJNT, validateBech32 } from '../utils'
import { AbstractBlockchain } from './chain'
import { ChainVM, VMWalletType } from './vm'

export const JVM_ID: string = 'otSmSxFRBqdRX7kestRW732n3WS2MrLAoWwHZxHnmMGMuLYX8'

const HD_PATH = 9000

export class JVMBlockchain extends AbstractBlockchain {
  constructor (name: string, id: string, asset: JNTAsset, aliases?: string[], registeredAssets: TokenAsset[] = []) {
    super(name, id, new ChainVM(JVM_ID, VMWalletType.Utxo, HD_PATH), asset, aliases, registeredAssets)
  }

  protected async fetchAsset (provider: MCNProvider, assetId: string): Promise<TokenAsset> {
    return await fetchJNT(provider, assetId)
  }

  validateAddress (address: string, hrp?: string): boolean {
    return validateBech32(address, hrp, this.aliases.concat(this.id))
  }
}
