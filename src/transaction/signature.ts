import { JuneoBuffer, type Serializable } from '../utils/bytes'
import { type VMWallet } from '../wallet'
import { type Signature, SignatureSize } from './types'

export interface Signable {
  sign: (bytes: JuneoBuffer, wallets: VMWallet[]) => Signature[]
}

export interface TransactionCredentials extends Serializable {
  typeId: number
  signatures: Signature[]
}

export class Secp256k1Credentials implements TransactionCredentials {
  typeId: number = 0x00000009
  signatures: Signature[]

  constructor (signatures: Signature[]) {
    this.signatures = signatures
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 4 + 4 = 8
      8 + SignatureSize * this.signatures.length
    )
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.signatures.length)
    this.signatures.forEach((signature) => {
      buffer.write(signature.serialize())
    })
    return buffer
  }
}

export function sign (bytes: JuneoBuffer, unsignedInputs: Signable[], wallets: VMWallet[]): JuneoBuffer {
  const credentials: JuneoBuffer[] = []
  let credentialsSize: number = 0
  unsignedInputs.forEach((input) => {
    const signatures: Signature[] = input.sign(bytes, wallets)
    const credential: JuneoBuffer = new Secp256k1Credentials(signatures).serialize()
    credentialsSize += credential.length
    credentials.push(credential)
  })
  const buffer: JuneoBuffer = JuneoBuffer.alloc(bytes.length + 4 + credentialsSize)
  buffer.write(bytes)
  buffer.writeUInt32(credentials.length)
  credentials.forEach((credential) => {
    buffer.write(credential)
  })
  return buffer
}
