import { type Serializable, JuneoBuffer, SignatureError } from '../../utils'
import { type VMWallet } from '../../wallet'
import { getSignersIndices } from '../builder'
import { type Signable } from '../signature'
import { type Address, type BLSPublicKey, type BLSSignature, Signature } from '../types'
import { type Secp256k1OutputOwners } from './validation'

export const SupernetAuthTypeId: number = 0x0000000a
export const EmptySignerTypeId: number = 0x0000001b
export const PrimarySignerTypeId: number = 0x0000001c

export class SupernetAuth implements Serializable, Signable {
  readonly typeId: number = SupernetAuthTypeId
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
      for (const wallet of wallets) {
        if (address.matches(wallet.getJuneoAddress())) {
          signatures.push(new Signature(wallet.sign(bytes)))
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
    const buffer: JuneoBuffer = JuneoBuffer.alloc(publicKeyBytes.length + signatureBytes.length)
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
    const buffer: JuneoBuffer = JuneoBuffer.alloc(4)
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
