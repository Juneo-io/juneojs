import { Buffer } from 'buffer/'
import hash from 'create-hash'
import { Signature, recoverPublicKey, getPublicKey, signSync } from '@noble/secp256k1'
import { JuneoBuffer } from './bytes'

export const SignatureLength: number = 65

export function rmd160 (data: string | JuneoBuffer): JuneoBuffer {
  const buffer: JuneoBuffer = typeof data === 'string'
    ? JuneoBuffer.fromString(data, 'hex')
    : data
  return JuneoBuffer.fromBytes(Buffer.from(hash('ripemd160').update(buffer.getBytes()).digest()))
}

export function sha256 (data: string | JuneoBuffer): JuneoBuffer {
  const buffer: JuneoBuffer = typeof data === 'string'
    ? JuneoBuffer.fromString(data, 'hex')
    : data
  return JuneoBuffer.fromBytes(Buffer.from(hash('sha256').update(buffer.getBytes()).digest()))
}

function recoverPubKey (hash: Buffer, signature: Signature, recovery: number): string {
  return JuneoBuffer.fromBytes(Buffer.from(recoverPublicKey(hash, signature, recovery, true))).toHex().padStart(66, '0')
}

export class ECKeyPair {
  private readonly privateKey: string
  readonly publicKey: string

  constructor (privateKey: string) {
    this.privateKey = privateKey
    this.publicKey = JuneoBuffer.fromBytes(Buffer.from(getPublicKey(privateKey, true))).toHex().padStart(66, '0')
  }

  sign (buffer: JuneoBuffer): JuneoBuffer {
    const signature: Signature = Signature.fromHex(signSync(buffer.getBytes(), this.privateKey))
    // noble as of v1.7.1 does not provide recovery param so do it here
    const v: number = recoverPubKey(buffer.getBytes(), signature, 0) === this.publicKey ? 0 : 1
    return JuneoBuffer.fromString(`${signature.toCompactHex()}${v.toString(16).padStart(2, '0')}`)
  }
}
