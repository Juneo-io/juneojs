import { JRC20ContractAdapter, WrappedContractAdapter } from '../solidity'
import { AssetValue } from '../utils'

const EVMGasTokenDecimals = 18

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

/**
 * Representation of the gas token used to pay fees in an JEVM.
 * JEVM gas token also has a reference to its native JNT asset.
 * It is also known as the native asset of a JEVM.
 */
export class JEVMGasToken extends EVMGasToken {
  nativeAsset: JNTAsset

  constructor (nativeAsset: JNTAsset) {
    super(nativeAsset.assetId, nativeAsset.name, nativeAsset.symbol)
    this.nativeAsset = nativeAsset
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
