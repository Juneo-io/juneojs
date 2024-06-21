import { JuneoBuffer, ParsingError, type Serializable } from '../utils'
import { Secp256k1CredentialsTypeId, SignatureSize } from './constants'
import { Signature, type Address } from './types'

export interface Signer {
  sign: (bytes: JuneoBuffer) => Promise<JuneoBuffer>
  matches: (address: Address) => boolean
}

export interface Signable {
  sign: (bytes: JuneoBuffer, signers: Signer[]) => Promise<Signature[]>
  getAddresses: () => Address[]
  getThreshold: () => number
}

export abstract class AbstractSignable implements Signable {
  async sign (bytes: JuneoBuffer, signers: Signer[]): Promise<Signature[]> {
    const addresses = this.getAddresses()
    const signatures: Signature[] = []
    for (let i = 0; i < this.getThreshold() && i < addresses.length; i++) {
      const address = addresses[i]
      for (const signer of signers) {
        if (signer.matches(address)) {
          const signature = await signer.sign(bytes)
          signatures.push(new Signature(signature))
          break
        }
      }
    }
    return signatures
  }

  abstract getAddresses (): Address[]

  abstract getThreshold (): number
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

  static parse (data: string | JuneoBuffer): TransactionCredentials {
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    const typeId = reader.readUInt32()
    const signatures: Signature[] = []
    while (reader.getCursor() < buffer.length - SignatureSize) {
      signatures.push(new Signature(reader.read(SignatureSize)))
    }
    switch (typeId) {
      case Secp256k1CredentialsTypeId: {
        return new Secp256k1Credentials(signatures)
      }
      default: {
        throw new ParsingError(`unsupported credentials type id "${typeId}"`)
      }
    }
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
