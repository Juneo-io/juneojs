import { type Serializable, JuneoBuffer, ParsingError } from '../../utils'
import { AddressSize, NodeIdSize, Secp256k1OutputOwnersTypeId, ValidatorSize } from '../constants'
import { type TransactionOutput } from '../output'
import { Address, NodeId } from '../types'

export class Validator implements Serializable {
  nodeId: NodeId
  startTime: bigint
  endTime: bigint
  weight: bigint

  constructor (nodeId: NodeId, startTime: bigint, endTime: bigint, weight: bigint) {
    this.nodeId = nodeId
    this.startTime = startTime
    this.endTime = endTime
    this.weight = weight
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(ValidatorSize)
    buffer.write(this.nodeId.serialize())
    buffer.writeUInt64(this.startTime)
    buffer.writeUInt64(this.endTime)
    buffer.writeUInt64(this.weight)
    return buffer
  }

  static parse (data: string | JuneoBuffer): Validator {
    const reader = JuneoBuffer.from(data).createReader()
    const nodeId = new NodeId(reader.read(NodeIdSize).toCB58())
    return new Validator(nodeId, reader.readUInt64(), reader.readUInt64(), reader.readUInt64())
  }
}

export class Secp256k1OutputOwners implements TransactionOutput {
  readonly typeId = Secp256k1OutputOwnersTypeId
  locktime: bigint
  threshold: number
  addresses: Address[]

  constructor (locktime: bigint, threshold: number, addresses: Address[]) {
    this.locktime = locktime
    this.threshold = threshold
    this.addresses = addresses.sort(Address.comparator)
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 4 + 8 + 4 + 4 = 20
      20 + AddressSize * this.addresses.length
    )
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt64(this.locktime)
    buffer.writeUInt32(this.threshold)
    buffer.writeUInt32(this.addresses.length)
    for (const address of this.addresses) {
      buffer.write(address.serialize())
    }
    return buffer
  }

  static parse (data: string | JuneoBuffer): Secp256k1OutputOwners {
    const reader = JuneoBuffer.from(data).createReader()
    const typeId = reader.readUInt32()
    if (typeId !== Secp256k1OutputOwnersTypeId) {
      throw new ParsingError(`invalid type id ${typeId} expected ${Secp256k1OutputOwnersTypeId}`)
    }
    const locktime = reader.readUInt64()
    const threshold = reader.readUInt32()
    const addressesCount = reader.readUInt32()
    const addresses: Address[] = []
    for (let i = 0; i < addressesCount; i++) {
      const address = new Address(reader.read(AddressSize))
      addresses.push(address)
    }
    return new Secp256k1OutputOwners(locktime, threshold, addresses)
  }
}
