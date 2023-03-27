
import { Buffer } from 'buffer/'
import { ec as EC } from 'elliptic'
import { CryptoError } from './errors'
import hash from 'create-hash'
import { JuneoBuffer } from './bytes'

const Secp256k1: EC = new EC('secp256k1')

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

export class ECKeyPair {
  private readonly keyPair: EC.KeyPair

  constructor (privateKey: string) {
    this.keyPair = Secp256k1.keyFromPrivate(privateKey, 'hex')
  }

  getPublicKey (): string {
    return this.keyPair.getPublic(true, 'hex').padStart(66, '0')
  }

  sign (buffer: JuneoBuffer): JuneoBuffer {
    const signature: EC.Signature = this.keyPair.sign(buffer.getBytes(), { canonical: true })
    const r: Buffer = Buffer.from(signature.r.toArray('be', 32))
    const s: Buffer = Buffer.from(signature.s.toArray('be', 32))
    const v: Buffer = Buffer.alloc(1)
    const recoveryParam: number | null = signature.recoveryParam
    if (recoveryParam === null || typeof recoveryParam !== 'number') {
      throw new CryptoError('could not retrieve recovery param')
    }
    v.writeUInt8(recoveryParam, 0)
    return JuneoBuffer.fromBytes(Buffer.concat([r, s, v], SignatureLength))
  }
}
