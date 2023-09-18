import { SignatureError, sha256 } from '../../utils'
import { JuneoBuffer, type Serializable } from '../../utils/bytes'
import { type VMWallet } from '../../wallet'
import { getSignersIndices } from '../builder'
import { Secp256k1Output, Secp256k1OutputTypeId, type TransactionOutput } from '../output'
import { type Signable } from '../signature'
import { Address, AddressSize, NodeId, NodeIdSize, Signature } from '../types'

export const Secp256k1OutputOwnersTypeId: number = 0x0000000b
export const SubnetAuthTypeId: number = 0x0000000a

export class Validator implements Serializable {
  static Size: number = 44
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
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      NodeIdSize + 8 + 8 + 8
    )
    buffer.write(this.nodeId.serialize())
    buffer.writeUInt64(this.startTime)
    buffer.writeUInt64(this.endTime)
    buffer.writeUInt64(this.weight)
    return buffer
  }

  static parse (data: string | JuneoBuffer): Validator {
    const buffer: JuneoBuffer = typeof data === 'string'
      ? JuneoBuffer.fromString(data)
      : data
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
    this.addresses.forEach(address => {
      buffer.write(address.serialize())
    })
    return buffer
  }

  static parse (data: string | JuneoBuffer): Secp256k1OutputOwners {
    const buffer: JuneoBuffer = typeof data === 'string'
      ? JuneoBuffer.fromString(data)
      : data
    let position: number = 0
    const typeId: number = buffer.readUInt32(position)
    position += 4
    // we must check this due to a bug? in current network version
    if (typeId === Secp256k1OutputTypeId) {
      const output: Secp256k1Output = Secp256k1Output.parse(buffer)
      return new Secp256k1OutputOwners(
        output.locktime,
        output.threshold,
        output.addresses
      )
    }
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

export class SupernetAuth implements Serializable, Signable {
  readonly typeId: number = SubnetAuthTypeId
  addressIndices: number[]
  rewardsOwner: Secp256k1OutputOwners

  constructor (addresses: Address[], rewardsOwner: Secp256k1OutputOwners) {
    this.addressIndices = getSignersIndices(addresses, rewardsOwner.addresses)
    this.addressIndices.sort((a: number, b: number) => {
      return a - b
    })
    this.rewardsOwner = rewardsOwner
  }

  sign (bytes: JuneoBuffer, wallets: VMWallet[]): Signature[] {
    const signatures: Signature[] = []
    const threshold: number = this.rewardsOwner.threshold
    for (let i = 0; i < threshold && i < this.addressIndices.length; i++) {
      const address: Address = this.rewardsOwner.addresses[i]
      for (let j = 0; j < wallets.length; j++) {
        const wallet: VMWallet = wallets[j]
        if (address.matches(wallet.getJuneoAddress())) {
          signatures.push(new Signature(wallet.sign(sha256(bytes))))
          break
        }
      }
    }
    if (signatures.length < threshold) {
      throw new SignatureError('missing wallets to complete supernet signatures')
    }
    return signatures
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      4 + 4 + this.addressIndices.length * 4
    )
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.addressIndices.length)
    this.addressIndices.forEach(indice => {
      buffer.writeUInt32(indice)
    })
    return buffer
  }
}
