
import * as elliptic from 'elliptic'
import { Buffer } from 'buffer'

const EC: typeof elliptic.ec = elliptic.ec
const Curve: elliptic.ec = new EC('secp256k1')

export class ECKeyPair {
  private readonly keyPair: elliptic.ec.KeyPair

  constructor (privateKey: string) {
    this.keyPair = Curve.keyFromPrivate(privateKey, 'hex')
  }

  getPublicKey (): string {
    return this.keyPair.getPublic(true, 'hex').padStart(66, '0')
  }

  sign (buffer: Buffer): Buffer {
    const signature: elliptic.ec.Signature = this.keyPair.sign(buffer, undefined, { canonical: true })
    const r: Buffer = Buffer.from(signature.r.toArray('be', 32))
    const s: Buffer = Buffer.from(signature.s.toArray('be', 32))
    const v: Buffer = Buffer.alloc(1)
    v.writeUint8(signature.recoveryParam, 0)
    return Buffer.concat([r, s, v], 65)
  }
}
