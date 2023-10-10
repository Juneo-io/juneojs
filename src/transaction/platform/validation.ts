import { SignatureError, sha256 } from '../../utils'
import { JuneoBuffer, type Serializable } from '../../utils/bytes'
import { type VMWallet } from '../../wallet'
import { getSignersIndices } from '../builder'
import { type TransactionOutput } from '../output'
import { type Signable } from '../signature'
import { Address, AddressSize, type BLSPublicKey, type BLSSignature, NodeId, NodeIdSize, Signature } from '../types'

export const Secp256k1OutputOwnersTypeId: number = 0x0000000b
export const SubnetAuthTypeId: number = 0x0000000a

export const PrimarySignerTypeId: number = 0x1b
export const EmptySignerTypeId: number = 0x1c

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
    const buffer: JuneoBuffer = JuneoBuffer.alloc(NodeIdSize + 8 + 8 + 8)
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
    this.addresses.forEach((address) => {
      buffer.write(address.serialize())
    })
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
    const buffer: JuneoBuffer = JuneoBuffer.alloc(4 + 4 + this.addressIndices.length * 4)
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.addressIndices.length)
    this.addressIndices.forEach((indice) => {
      buffer.writeUInt32(indice)
    })
    return buffer
  }
}

export class ProofOfPossession implements Serializable {
  publicKey: BLSPublicKey
  signature: BLSSignature

  constructor (publicKey: BLSPublicKey, signature: BLSSignature) {
    this.publicKey = publicKey
    this.signature = signature
  }

  serialize (): JuneoBuffer {
    const publicKeyBytes: JuneoBuffer = this.publicKey.serialize()
    const signatureBytes: JuneoBuffer = this.signature.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(4 + publicKeyBytes.length + signatureBytes.length)
    buffer.write(publicKeyBytes)
    buffer.write(signatureBytes)
    return buffer
  }
}

export class BLSSigner implements Serializable {
  typeId: number

  constructor (typeId: number) {
    this.typeId = typeId
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(1)
    buffer.writeUInt8(this.typeId)
    return buffer
  }
}

export class PrimarySigner extends BLSSigner {
  signer: ProofOfPossession

  constructor (signer: ProofOfPossession) {
    super(PrimarySignerTypeId)
    this.signer = signer
  }

  serialize (): JuneoBuffer {
    const baseBytes: JuneoBuffer = super.serialize()
    const signerBytes: JuneoBuffer = this.signer.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(baseBytes.length + signerBytes.length)
    buffer.write(baseBytes)
    buffer.write(signerBytes)
    return buffer
  }
}

export class EmptySignature extends BLSSigner {
  constructor () {
    super(EmptySignerTypeId)
  }
}
