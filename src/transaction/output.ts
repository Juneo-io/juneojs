import { ParsingError } from '../utils'
import { JuneoBuffer, type Serializable } from '../utils/bytes'
import { Address, AddressSize, type AssetId, AssetIdSize } from './types'

export const Secp256k1OutputTypeId: number = 0x00000007

export class TransferableOutput implements Serializable {
  assetId: AssetId
  output: TransactionOutput & Serializable

  constructor (assetId: AssetId, output: TransactionOutput & Serializable) {
    this.assetId = assetId
    this.output = output
  }

  serialize (): JuneoBuffer {
    const outputBuffer: JuneoBuffer = this.output.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      AssetIdSize + outputBuffer.length
    )
    buffer.write(this.assetId.serialize())
    buffer.write(outputBuffer)
    return buffer
  }

  static comparator = (a: TransferableOutput, b: TransferableOutput): number => {
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
  }

  static parseOutput (data: string | JuneoBuffer): TransactionOutput {
    const buffer: JuneoBuffer = typeof data === 'string'
      ? JuneoBuffer.fromString(data)
      : data
    const typeId: number = buffer.readUInt32(0)
    if (typeId === Secp256k1OutputTypeId) {
      return Secp256k1Output.parse(data)
    } else {
      throw new ParsingError(`unsupported output type id "${typeId}"`)
    }
  }
}

export interface TransactionOutput {
  typeId: number
  locktime: bigint
  threshold: number
  addresses: Address[]
}

export class Secp256k1Output implements TransactionOutput, Serializable {
  readonly typeId: number = Secp256k1OutputTypeId
  amount: bigint
  locktime: bigint
  threshold: number
  addresses: Address[]

  constructor (amount: bigint, locktime: bigint, threshold: number, addresses: Address[]) {
    this.amount = amount
    this.locktime = locktime
    this.threshold = threshold
    this.addresses = addresses.sort(Address.comparator)
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 4 + 8 + 8 + 4 + 4 = 28
      28 + AddressSize * this.addresses.length
    )
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt64(this.amount)
    buffer.writeUInt64(this.locktime)
    buffer.writeUInt32(this.threshold)
    buffer.writeUInt32(this.addresses.length)
    this.addresses.forEach(address => {
      buffer.write(address.serialize())
    })
    return buffer
  }

  static parse (data: string | JuneoBuffer): Secp256k1Output {
    const buffer: JuneoBuffer = typeof data === 'string'
      ? JuneoBuffer.fromString(data)
      : data
    let position: number = 0
    // skip type id reading
    position += 4
    const amount: bigint = buffer.readUInt64(position)
    position += 8
    const locktime: bigint = buffer.readUInt64(position)
    position += 8
    const threshold: number = buffer.readUInt32(position)
    position += 4
    const addressesCount: number = buffer.readUInt32(position)
    position += 4
    const addresses: Address[] = []
    for (let i = 0; i < addressesCount; i++) {
      const address: Address = new Address(buffer.read(position, AddressSize))
      position += AddressSize
      addresses.push(address)
    }
    return new Secp256k1Output(amount, locktime, threshold, addresses)
  }
}