
import { Buffer } from 'buffer'
import { DecodingError } from './errors'
import hash from 'create-hash'
import bs58 from 'bs58'

export function concatChecksum (buffer: Buffer): Buffer {
  const hashBuffer: Buffer = hash('sha256').update(buffer).digest().slice(28)
  const buffers: Buffer[] = [buffer, hashBuffer]
  return Buffer.concat(buffers)
}

export function verifyChecksum (value: Buffer): boolean {
  if (value.length < 5) {
    return false
  }
  const buffer: Buffer = value.subarray(0, value.length - 4)
  return value.toString('hex') === concatChecksum(buffer).toString('hex')
}

export function encodeCB58 (buffer: Buffer): string {
  const bytes: Buffer = concatChecksum(buffer)
  return bs58.encode(bytes)
}

export function isBase58 (value: string): boolean {
  return /^[A-HJ-NP-Za-km-z1-9]*$/.test(value)
}

export function decodeCB58 (value: string): Buffer {
  if (!isBase58(value)) {
    throw new DecodingError('value is not base58')
  }
  let buffer: Buffer = Buffer.from(value)
  if (!verifyChecksum(Buffer.from(buffer))) {
    throw new DecodingError('value checksum is not valid')
  }
  buffer = buffer.subarray(0, buffer.length - 4)
  return Buffer.from(bs58.decode(buffer.toString()))
}

export function encodeCHex (buffer: Buffer): string {
  const bytes: Buffer = concatChecksum(buffer)
  return `0x${bytes.toString('hex')}`
}

export function isHex (value: string): boolean {
  const hasPrefix: boolean = value.length > 2 && value.substring(0, 2) === '0x'
  const regex = /[0-9A-Fa-f]{6}/g
  return hasPrefix ? regex.test(value.substring(0, 2)) : regex.test(value)
}

export function decodeCHex (value: string): Buffer {
  if (!isHex(value)) {
    throw new DecodingError('value is not hexadecimal')
  }
  const buffer: Buffer = Buffer.from(value, 'hex')
  if (!verifyChecksum(buffer)) {
    throw new DecodingError('value checksum is not valid')
  }
  return buffer.subarray(0, buffer.length - 4)
}
