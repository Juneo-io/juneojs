import { JRC20ContractAdapter } from '../chain'
import { TokenType } from './asset'
import { ERC20Asset, EVMGasToken } from './evm'
import { type JNTAsset } from './jvm'

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
