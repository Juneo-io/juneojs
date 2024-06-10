import { JuneoBuffer, type Serializable } from '../utils'
import { type VMWallet } from '../wallet'
import { Secp256k1CredentialsTypeId, SignatureSize } from './constants'
import { type Signature } from './types'

export interface Signable {
  sign: (bytes: JuneoBuffer, wallets: VMWallet[]) => Signature[]
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

export function sign (bytes: JuneoBuffer, unsignedInputs: Signable[], wallets: VMWallet[]): JuneoBuffer {
  const credentials: JuneoBuffer[] = []
  let credentialsSize: number = 0
  for (const input of unsignedInputs) {
    const signatures: Signature[] = input.sign(bytes, wallets)
    const credential: TransactionCredentials = new Secp256k1Credentials(signatures)
    const credentialBytes: JuneoBuffer = credential.serialize()
    credentialsSize += credentialBytes.length
    credentials.push(credentialBytes)
  }
  const buffer: JuneoBuffer = JuneoBuffer.alloc(bytes.length + 4 + credentialsSize)
  buffer.write(bytes)
  buffer.writeUInt32(credentials.length)
  credentials.sort(JuneoBuffer.comparator)
  for (const credential of credentials) {
    buffer.write(credential)
  }
  return buffer
}
