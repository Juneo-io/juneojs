import { type Serializable, JuneoBuffer } from '../../utils'
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
    const buffer: JuneoBuffer = typeof data === 'string' ? JuneoBuffer.fromString(data) : data
    let position: number = 0
    const nodeId: NodeId = new NodeId(buffer.read(position, NodeIdSize).toCB58())
    position += NodeIdSize
    const startTime: bigint = buffer.readUInt64(position)
    position += 8
    const endTime: bigint = buffer.readUInt64(position)
    position += 8
    const weight: bigint = buffer.readUInt64(position)
    return new Validator(nodeId, startTime, endTime, weight)
  }
}

export class Secp256k1OutputOwners implements TransactionOutput {
  readonly typeId: number = Secp256k1OutputOwnersTypeId
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
    const buffer: JuneoBuffer = typeof data === 'string' ? JuneoBuffer.fromString(data) : data
    let position: number = 4
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
    return new Secp256k1OutputOwners(locktime, threshold, addresses)
  }
}
