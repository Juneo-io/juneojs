import { JuneoBuffer, type Serializable } from '../utils'
import { Secp256k1CredentialsTypeId, SignatureSize } from './constants'
import { Signature, type Address } from './types'

export interface Signer {
  sign: (bytes: JuneoBuffer) => Promise<JuneoBuffer>
  matches: (address: Address) => boolean
}

export interface Signable {
  sign: (bytes: JuneoBuffer, signers: Signer[]) => Promise<Signature[]>
  getThreshold: () => number
}

export abstract class AbstractSignable {
  async sign (bytes: JuneoBuffer, signers: Signer[], address: Address, signatures: Signature[]): Promise<Signature[]> {
    for (const signer of signers) {
      if (signer.matches(address)) {
        const signature = await signer.sign(bytes)
        signatures.push(new Signature(signature))
        break
      }
    }
    return signatures
  }
}

export abstract class TransactionCredentials implements Serializable {
  typeId: number
  signatures: Signature[]

  constructor (typeId: number, signatures: Signature[]) {
    this.typeId = typeId
    this.signatures = signatures
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 4 + 4 = 8
      8 + SignatureSize * this.signatures.length
    )
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.signatures.length)
    for (const signature of this.signatures) {
      buffer.write(signature.serialize())
    }
    return buffer
  }

  static comparator = (a: TransactionCredentials, b: TransactionCredentials): number => {
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
  }
}

export class Secp256k1Credentials extends TransactionCredentials {
  constructor (signatures: Signature[]) {
    super(Secp256k1CredentialsTypeId, signatures)
  }
}

// export class SignedTransaction {
//   unsignedTransaction: UnsignedTransaction
// }
