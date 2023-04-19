
export class JRC20Asset {
  id: string
  chainId: string
  contractAddress: string

  constructor (id: string, chainId: string, contractAddress: string) {
    this.id = id
    this.chainId = chainId
    this.contractAddress = contractAddress
  }
}

export class AssetBalance {
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
