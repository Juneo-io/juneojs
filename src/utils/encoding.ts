
import { Buffer } from 'buffer'
import { DecodingError } from './errors'
import * as bech32 from 'bech32'
import hash from 'create-hash'
import bs58 from 'bs58'

export function concatChecksum (buffer: Buffer): Buffer {
  const hashBuffer: Buffer = hash('sha256').update(buffer).digest().subarray(28, 32)
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

export function encodeBech32 (hrp: string, buffer: Buffer): string {
  return bech32.bech32.encode(hrp, bech32.bech32.toWords(buffer))
}

export function decodeBech32 (value: string): Buffer {
  const split: string[] = value.split('-')
  const part: string = split.length > 1 ? split[1] : split[0]
  const startIndex: number = part.lastIndexOf('1')
  if (startIndex < 0) {
    throw new DecodingError('bech32 format must include "1" separator')
  }
  const hrp: string = part.slice(0, startIndex)
  if (hrp.length < 1) {
    throw new DecodingError('bech32 hrp missing')
  }
  return Buffer.from(bech32.bech32.fromWords(bech32.bech32.decode(part).words))
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
  const hasPrefix: boolean = hasHexPrefix(value)
  const regex = /[0-9A-Fa-f]/g
  return hasPrefix ? regex.test(value.substring(2)) : regex.test(value)
}

export function hasHexPrefix (value: string): boolean {
  return value.length > 2 && value.substring(0, 2) === '0x'
}

export function decodeHex (value: string): Buffer {
  if (!isHex(value)) {
    throw new DecodingError('value is not hexadecimal')
  }
  let hex: string = value
  if (hasHexPrefix(hex)) {
    hex = hex.substring(2)
  }
  return Buffer.from(hex, 'hex')
}

export function decodeCHex (value: string): Buffer {
  const buffer: Buffer = decodeHex(value)
  if (!verifyChecksum(buffer)) {
    throw new DecodingError('value checksum is not valid')
  }
  return buffer.subarray(0, buffer.length - 4)
}
