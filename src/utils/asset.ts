const RoundedValueDefaultDecimals = 2

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
    let value: string = this.getReadableValuePadded()
    if (value.indexOf('.') < 1) {
      return value
    }
    while (value.lastIndexOf('0') === value.length - 1) {
      value = value.substring(0, value.length - 1)
    }
    if (value.charAt(value.length - 1) === '.') {
      return value.substring(0, value.length - 1)
    }
    return value
  }

  /**
   * Get a human friendly representation of this value padded with zeros.
   * @returns The complete value with its decimals separated by a dot and zero padded.
   */
  getReadableValuePadded (): string {
    let stringValue: string = this.value.toString()
    if (stringValue.charAt(0) === '-') {
      stringValue = stringValue.substring(1, stringValue.length)
    }
    const length: number = stringValue.length
    const prefix: string = this.value < 0 ? '-' : ''
    if (length <= this.decimals) {
      return `${prefix}0.${stringValue.padStart(this.decimals, '0')}`
    } else {
      let readableValue: string = stringValue.substring(0, length - this.decimals)
      if (this.decimals > 0) {
        readableValue += '.'
        readableValue += stringValue.substring(length - this.decimals, length).padEnd(this.decimals, '0')
      }
      return `${prefix}${readableValue}`
    }
  }

  /**
   * Get a human friendly representation of this value rounded to n decimals.
   * @param decimals **Optional**. The amount of decimals to display. If none are provided defaults to a hardcoded value.
   * @returns The value with its decimals separated by a dot. Decimals are rounded
   * by the provided number.
   */
  getReadableValueRounded (decimals: number = RoundedValueDefaultDecimals): string {
    const readableValue: string = this.getReadableValuePadded()
    if (this.decimals < 1) {
      return readableValue
    }
    let index: number = readableValue.indexOf('.')
    index += decimals + 1
    let value: string = readableValue.substring(0, index)
    if (Number(value) === 0 && value.charAt(0) === '-') {
      value = value.substring(1, value.length)
    }
    if (value.charAt(value.length - 1) === '.') {
      return `${value.substring(0, value.length - 1)}`
    }
    return `${value}`
  }
}
