import { JuneoBuffer, type Serializable } from '../utils/bytes'
import { type VMWallet } from '../wallet'
import { type Signature, SignatureSize } from './types'

export interface Signable {
  sign: (wallets: VMWallet[]) => JuneoBuffer
}

export interface TransactionCredentials {
  typeId: number
  signatures: Signature[]
}

export class Secp256k1Credentials implements TransactionCredentials, Serializable {
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
    this.signatures.forEach(signature => {
      buffer.write(signature.serialize())
    })
    return buffer
  }
}
