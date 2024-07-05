import { JuneoBuffer, SignatureError, TimeUtils, type Serializable } from '../../utils'
import { getSignersIndices } from '../builder'
import {
  BLSPublicKeySize,
  BLSSignatureSize,
  EmptySignerTypeId,
  NodeIdSize,
  PrimarySignerTypeId,
  ProofOfPossessionSize,
  SupernetAuthTypeId,
  ValidatorSize
} from '../constants'
import { type Secp256k1OutputOwners } from '../output'
import { AbstractSignable } from '../signature'
import { BLSPublicKey, BLSSignature, NodeId, type Address } from '../types'

export class Validator implements Serializable {
  nodeId: NodeId
  startTime: bigint
  endTime: bigint
  stakePeriod: bigint
  weight: bigint

  constructor (nodeId: NodeId, stakePeriod: bigint, weight: bigint) {
    this.nodeId = nodeId
    // Since Durango upgrade only end time value is used to calculate stake period,
    // so we use a start time of zero and only sync the end time to instantiate a new validator.
    this.startTime = BigInt(0)
    this.endTime = TimeUtils.now() + stakePeriod
    this.stakePeriod = stakePeriod
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
    const startTime = reader.readUInt64()
    const endTime = reader.readUInt64()
    return new Validator(nodeId, endTime - startTime, reader.readUInt64())
  }
}

export class SupernetAuth extends AbstractSignable implements Serializable {
  readonly typeId: number = SupernetAuthTypeId
  addressIndices: number[]
  rewardsOwner: Secp256k1OutputOwners | undefined

  constructor (addresses: Address[], rewardsOwner?: Secp256k1OutputOwners) {
    super()
    this.addressIndices = []
    if (typeof rewardsOwner !== 'undefined') {
      this.addressIndices = getSignersIndices(addresses, rewardsOwner.addresses)
      this.addressIndices.sort((a: number, b: number) => {
        return a - b
      })
    }
    this.rewardsOwner = rewardsOwner
  }

  getAddresses (): Address[] {
    if (typeof this.rewardsOwner === 'undefined') {
      throw new SignatureError('cannot get addresses of read only supernet auth')
    }
    const addresses: Address[] = []
    for (let i = 0; i < this.addressIndices.length; i++) {
      addresses.push(this.rewardsOwner.addresses[i])
    }
    return addresses
  }

  getThreshold (): number {
    if (typeof this.rewardsOwner === 'undefined') {
      throw new SignatureError('cannot get threshold of read only supernet auth')
    }
    return this.rewardsOwner.threshold
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(4 + 4 + this.addressIndices.length * 4)
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.addressIndices.length)
    for (const indice of this.addressIndices) {
      buffer.writeUInt32(indice)
    }
    return buffer
  }

  static parse (data: string | JuneoBuffer): SupernetAuth {
    const reader = JuneoBuffer.from(data).createReader()
    reader.readAndVerifyTypeId(SupernetAuthTypeId)
    const addressIndicesCount = reader.readUInt32()
    const indices: number[] = []
    for (let i = 0; i < addressIndicesCount; i++) {
      const indice = reader.readUInt32()
      indices.push(indice)
    }
    const supernetAuth = new SupernetAuth([])
    supernetAuth.addressIndices = indices
    return supernetAuth
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
    const buffer: JuneoBuffer = JuneoBuffer.alloc(publicKeyBytes.length + signatureBytes.length)
    buffer.write(publicKeyBytes)
    buffer.write(signatureBytes)
    return buffer
  }

  static parse (data: string | JuneoBuffer): ProofOfPossession {
    const reader = JuneoBuffer.from(data).createReader()
    return new ProofOfPossession(
      new BLSPublicKey(reader.read(BLSPublicKeySize).toHex()),
      new BLSSignature(reader.read(BLSSignatureSize).toHex())
    )
  }
}

export class BLSSigner implements Serializable {
  typeId: number

  constructor (typeId: number) {
    this.typeId = typeId
  }

  serialize (): JuneoBuffer {
    const buffer = JuneoBuffer.alloc(4)
    buffer.writeUInt32(this.typeId)
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
    const baseBytes = super.serialize()
    const signerBytes = this.signer.serialize()
    const buffer = JuneoBuffer.alloc(baseBytes.length + signerBytes.length)
    buffer.write(baseBytes)
    buffer.write(signerBytes)
    return buffer
  }

  static parse (data: string | JuneoBuffer): PrimarySigner {
    const reader = JuneoBuffer.from(data).createReader()
    reader.readAndVerifyTypeId(PrimarySignerTypeId)
    return new PrimarySigner(ProofOfPossession.parse(reader.read(ProofOfPossessionSize)))
  }
}

export class EmptySigner extends BLSSigner {
  constructor () {
    super(EmptySignerTypeId)
  }

  static parse (data: string | JuneoBuffer): EmptySigner {
    const reader = JuneoBuffer.from(data).createReader()
    reader.readAndVerifyTypeId(EmptySignerTypeId)
    return new EmptySigner()
  }
}
