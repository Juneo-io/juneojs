import { AssetValue } from '../utils'

export enum TokenType {
  Generic = 'generic',
  Gas = 'gas',
  ERC20 = 'erc20',
  Wrapped = 'wrapped',
  JRC20 = 'jrc20',
  JNT = 'jnt',
}

/**
 * Representation of an asset on a chain with its common values
 * such as an id, a name, a symbol and decimals.
 */
export class TokenAsset {
  readonly type: TokenType = TokenType.Generic
  readonly assetId: string
  readonly name: string
  readonly symbol: string
  readonly decimals: number

  constructor (assetId: string, name: string, symbol: string, decimals: number) {
    this.assetId = assetId
    this.name = name
    this.symbol = symbol
    this.decimals = decimals
  }

  /**
   * Get an AssetValue helper of this token set to a value.
   * @param value The value, or amount of this asset to set.
   * @returns A new AssetValue which can be used to display the provided value with the decimals of this token.
   */
  getAssetValue (value: bigint): AssetValue {
    return new AssetValue(value, this.decimals)
  }
}
