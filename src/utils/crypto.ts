
import { Buffer } from 'buffer'
import { ec as EC } from 'elliptic'
import { CryptoError } from './errors'

const Secp256k1: EC = new EC('secp256k1')

export class ECKeyPair {
  private readonly keyPair: EC.KeyPair

  constructor (privateKey: string) {
    this.keyPair = Secp256k1.keyFromPrivate(privateKey, 'hex')
  }

  getPublicKey (): string {
    return this.keyPair.getPublic(true, 'hex').padStart(66, '0')
  }

  sign (buffer: Buffer): Buffer {
    const signature: EC.Signature = this.keyPair.sign(buffer, { canonical: true })
    const r: Buffer = Buffer.from(signature.r.toArray('be', 32))
    const s: Buffer = Buffer.from(signature.s.toArray('be', 32))
    const v: Buffer = Buffer.alloc(1)
    const recoveryParam: number | null = signature.recoveryParam
    if (recoveryParam === null || typeof recoveryParam !== 'number') {
      throw new CryptoError('could not retrieve recovery param')
    }
    v.writeUint8(recoveryParam, 0)
    return Buffer.concat([r, s, v], 65)
  }
}
