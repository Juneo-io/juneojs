import { WrappedContractAdapter } from '../solidity'
import { TokenAsset, TokenType } from './asset'

const EVMGasTokenDecimals = 18

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
