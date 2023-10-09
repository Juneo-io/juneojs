import { TokenAsset, TokenType } from './asset'

/**
 * Representation of a Juneo native asset.
 */
export class JNTAsset extends TokenAsset {
  override readonly type: string = TokenType.JNT
  readonly mintable: boolean

  constructor (assetId: string, name: string, symbol: string, decimals: number, mintable: boolean) {
    super(assetId, name, symbol, decimals)
    this.mintable = mintable
  }
}
