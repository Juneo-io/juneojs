import { ripemd160 } from '@noble/hashes/ripemd160'
import { sha256 as nobleSha256 } from '@noble/hashes/sha256'
import { Signature, recoverPublicKey, getPublicKey, signSync, verify } from '@noble/secp256k1'
import { JuneoBuffer } from './bytes'

export function rmd160 (data: string | JuneoBuffer): JuneoBuffer {
  const buffer: JuneoBuffer = typeof data === 'string' ? JuneoBuffer.fromString(data, 'hex') : data
  return JuneoBuffer.fromBytes(Buffer.from(ripemd160(buffer.getBytes())))
}

export function sha256 (data: string | JuneoBuffer): JuneoBuffer {
  const buffer: JuneoBuffer = typeof data === 'string' ? JuneoBuffer.fromString(data, 'hex') : data
  return JuneoBuffer.fromBytes(Buffer.from(nobleSha256(buffer.getBytes())))
}

export function recoverPubKey (signature: JuneoBuffer, message: JuneoBuffer, recovery: number): string {
  const sig: Signature = parseSignature(signature)
  const bytes: Buffer = Buffer.from(recoverPublicKey(nobleSha256(message.getBytes()), sig, recovery, true))
  return JuneoBuffer.fromBytes(bytes).toHex().padStart(66, '0')
}

export function verifySignature (signature: JuneoBuffer, message: JuneoBuffer, publicKey: string): boolean {
  return verify(parseSignature(signature), nobleSha256(message.getBytes()), publicKey)
}

function parseSignature (signature: JuneoBuffer): Signature {
  return signature.length === 65
    ? Signature.fromCompact(signature.getBytes().subarray(0, 64))
    : Signature.fromCompact(signature.getBytes())
}

export class ECKeyPair {
  readonly privateKey: string
  readonly publicKey: string

  constructor (privateKey: string) {
    this.privateKey = privateKey
    this.publicKey = JuneoBuffer.fromBytes(Buffer.from(getPublicKey(privateKey, true)))
      .toHex()
      .padStart(66, '0')
  }

  sign (message: JuneoBuffer): JuneoBuffer {
    const signature: Signature = Signature.fromHex(signSync(nobleSha256(message.getBytes()), this.privateKey))
    // noble as of v1.7.1 does not provide recovery param so do it here
    const publicKey: string = recoverPubKey(JuneoBuffer.fromString(signature.toCompactHex()), message, 0)
    const v: number = publicKey === this.publicKey ? 0 : 1
    return JuneoBuffer.fromString(`${signature.toCompactHex()}${v.toString(16).padStart(2, '0')}`)
  }
}
