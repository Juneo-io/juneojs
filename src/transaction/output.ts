import { JuneoBuffer, type Serializable } from '../utils/bytes'
import { Address, AddressSize, type AssetId, AssetIdSize } from './types'

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
    buffer.write(outputBuffer)
    buffer.write(this.assetId.serialize())
    return buffer
  }

  static comparator = (a: TransferableOutput, b: TransferableOutput): number => {
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
  }
}

export interface TransactionOutput {
  typeId: number
  locktime: bigint
  threshold: number
  addresses: Address[]
}

export class Secp256k1Output implements TransactionOutput, Serializable {
  readonly typeId: number = 0x00000007
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
}
