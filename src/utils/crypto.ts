import { type RecoveredSignatureType } from '@noble/curves/abstract/weierstrass'
import { secp256k1 } from '@noble/curves/secp256k1'
import { ripemd160 } from '@noble/hashes/ripemd160'
import { sha256 as nobleSha256 } from '@noble/hashes/sha256'
import { type BytesLike, ethers } from 'ethers'
import { type Signature } from '../transaction'
import { JuneoBuffer } from './bytes'

export function rmd160 (data: string | JuneoBuffer): JuneoBuffer {
  const buffer = typeof data === 'string' ? JuneoBuffer.fromString(data, 'hex') : data
  return JuneoBuffer.fromBytes(Buffer.from(ripemd160(buffer.getBytes())))
}

export function sha256 (data: string | JuneoBuffer): JuneoBuffer {
  const buffer = typeof data === 'string' ? JuneoBuffer.fromString(data, 'hex') : data
  return JuneoBuffer.fromBytes(Buffer.from(nobleSha256(buffer.getBytes())))
}

export function recoverPubKey (signature: Signature, message: JuneoBuffer): string {
  const sig = parseSignature(signature)
  const bytes = Buffer.from(sig.recoverPublicKey(nobleSha256(message.getBytes())).toRawBytes(true))
  return JuneoBuffer.fromBytes(bytes).toHex()
}

export function verifySignature (signature: Signature, message: JuneoBuffer, publicKey: string): boolean {
  return secp256k1.verify(parseSignature(signature), nobleSha256(message.getBytes()), publicKey)
}

function parseSignature (signature: Signature): RecoveredSignatureType {
  const bytes = signature.serialize().getBytes()
  const sig = secp256k1.Signature.fromCompact(bytes.subarray(0, 64))
  return sig.addRecoveryBit(signature.v)
}

export class ECKeyPair {
  readonly privateKey: string
  readonly publicKey: string

  constructor (privateKey: string) {
    this.privateKey = privateKey
    this.publicKey = JuneoBuffer.fromBytes(Buffer.from(secp256k1.getPublicKey(privateKey, true))).toHex()
  }

  sign (message: JuneoBuffer): JuneoBuffer {
    const signature = secp256k1.sign(nobleSha256(message.getBytes()), this.privateKey)
    return JuneoBuffer.fromString(`${signature.toCompactHex()}${signature.recovery.toString(16).padStart(2, '0')}`)
  }
}

export function registerRandomBytes (func: (length: number) => Uint8Array<ArrayBufferLike>): void {
  ethers.randomBytes.register((len) => {
    return func(len)
  })
}

export function registerComputeHmac (
  func: (algorithm: 'sha256' | 'sha512', key: Uint8Array<ArrayBufferLike>, data: Uint8Array) => BytesLike
): void {
  ethers.computeHmac.register((algo, key, data) => {
    return func(algo, key, data)
  })
}

export function registerPbkdf2 (
  func: (
    password: Uint8Array<ArrayBufferLike>,
    salt: Uint8Array,
    iterations: number,
    keylen: number,
    algo: 'sha256' | 'sha512',
  ) => BytesLike
): void {
  ethers.pbkdf2.register((passwd, salt, iter, keylen, algo) => {
    return func(passwd, salt, iter, keylen, algo)
  })
}

export function registerSha256 (func: (data: Uint8Array<ArrayBufferLike>) => BytesLike): void {
  ethers.sha256.register((data) => {
    return func(data)
  })
}

export function registerSha512 (func: (data: Uint8Array<ArrayBufferLike>) => BytesLike): void {
  ethers.sha512.register((data) => {
    return func(data)
  })
}
