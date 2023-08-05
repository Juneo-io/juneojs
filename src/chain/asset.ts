import { WrappedContractAdapter } from '../solidity'
import { type JEVMBlockchain } from './chain'

export interface EVMContract {
  readonly address: string
}

export class ERC20Asset implements EVMContract {
  readonly address: string
  readonly name: string
  readonly symbol: string
  readonly decimals: number

  constructor (address: string, name: string, symbol: string, decimals: number) {
    this.address = address
    this.name = name
    this.symbol = symbol
    this.decimals = decimals
  }
}

export class WrappedAsset extends ERC20Asset {
  readonly chain: JEVMBlockchain
  readonly adapter: WrappedContractAdapter

  constructor (address: string, name: string, symbol: string, decimals: number, chain: JEVMBlockchain) {
    super(address, name, symbol, decimals)
    this.chain = chain
    this.adapter = new WrappedContractAdapter(chain, address)
  }
}

export class JRC20Asset extends ERC20Asset {
  assetId: string

  constructor (address: string, name: string, symbol: string, decimals: number, assetId: string) {
    super(address, name, symbol, decimals)
    this.assetId = assetId
  }
}

export class AssetValue {
  value: bigint
  readonly decimals: number

  constructor (value: bigint, decimals: number) {
    this.value = value
    this.decimals = decimals
  }

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

  getReadableValueRounded (decimals: number = 2): string {
    const readableValue: string = this.getReadableValue()
    if (this.decimals < 1) {
      return readableValue
    }
    let index: number = readableValue.indexOf('.')
    index += decimals + 1
    return readableValue.substring(0, index)
  }
}
