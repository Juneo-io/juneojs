import { JRC20ContractAdapter, WrappedContractAdapter } from '../solidity'

const RoundedValueDefaultDecimals = 2
const EVMGasTokenDecimals = 18

export interface TypedToken {
  type: string
}

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
export class TokenAsset implements TypedToken {
  readonly type: string = TokenType.Generic
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

/**
 * Representation of the gas token used to pay fees in an EVM.
 * It is also known as the native asset of an EVM.
 */
export class EVMGasToken extends TokenAsset {
  override readonly type: string = TokenType.Gas

  constructor (assetId: string, name: string, symbol: string) {
    super(assetId, name, symbol, EVMGasTokenDecimals)
  }
}

export interface EVMContract {
  readonly address: string
}

/**
 * Representation of an ERC20 smart contract.
 */
export class ERC20Asset extends TokenAsset implements EVMContract {
  override readonly type: string = TokenType.ERC20
  readonly address

  constructor (address: string, name: string, symbol: string, decimals: number) {
    super(address, name, symbol, decimals)
    this.address = address
  }
}

/**
 * Representation of a wrapped gas token smart contract.
 * Also known as wrapped native. In the Juneo network it is deployed as the wJUNE.
 */
export class WrappedAsset extends ERC20Asset {
  override readonly type: string = TokenType.Wrapped
  readonly adapter: WrappedContractAdapter

  constructor (address: string, name: string, symbol: string, decimals: number) {
    super(address, name, symbol, decimals)
    this.adapter = new WrappedContractAdapter(address)
  }
}

/**
 * Representation of a JRC20 smart contract.
 */
export class JRC20Asset extends ERC20Asset {
  override readonly type: string = TokenType.JRC20
  readonly nativeAssetId: string
  readonly adapter: JRC20ContractAdapter

  constructor (address: string, name: string, symbol: string, decimals: number, nativeAssetId: string) {
    super(address, name, symbol, decimals)
    this.nativeAssetId = nativeAssetId
    this.adapter = new JRC20ContractAdapter(address)
  }
}

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

/**
 * Representation of the value of an asset. It uses the decimals of the asset to provide
 * helper functions that are useful to display the properly formatted value to a user.
 */
export class AssetValue {
  value: bigint
  readonly decimals: number

  constructor (value: bigint, decimals: number) {
    this.value = value
    this.decimals = decimals
  }

  /**
   * Get an AssetValue from a string and the expected decimals.
   * The string can already contains some of the decimals if they are separated by a dot.
   * If there are more decimals in the provided string than in the decimals value, they will be truncated to decimals value.
   * @param value The string that contains the value to use.
   * @param decimals The number of decimals to format the value with.
   * @returns A new AssetValue with a value formatted from the provided string and decimals.
   */
  static from (value: string, decimals: number): AssetValue {
    const split: string[] = value.split('.')
    let tail: string = ''
    if (split.length > 1) {
      tail = split[1].length > decimals ? split[1].substring(0, decimals) : split[1]
    }
    return new AssetValue(BigInt(split[0] + tail.padEnd(decimals, '0')), decimals)
  }

  /**
   * Get a human friendly representation of this value.
   * @returns The complete value with its decimals separated by a dot.
   */
  getReadableValue (): string {
    const stringValue: string = this.value.toString()
    const length: number = stringValue.length
    if (length <= this.decimals) {
      return `0.${stringValue.padStart(this.decimals, '0')}`
    } else {
      let readableValue: string = stringValue.substring(0, length - this.decimals)
      if (this.decimals > 0) {
        readableValue += '.'
        readableValue += stringValue.substring(length - this.decimals, length).padEnd(this.decimals, '0')
      }
      return readableValue
    }
  }

  /**
   * Get a human friendly representation of this value rounded to n decimals.
   * @param decimals **Optional**. The amount of decimals to display. If none are provided defaults to a hardcoded value.
   * @returns The value with its decimals separated by a dot. Decimals are rounded
   * by the provided number.
   */
  getReadableValueRounded (decimals: number = RoundedValueDefaultDecimals): string {
    const readableValue: string = this.getReadableValue()
    if (this.decimals < 1) {
      return readableValue
    }
    let index: number = readableValue.indexOf('.')
    index += decimals + 1
    return readableValue.substring(0, index)
  }
}
