
import { Buffer } from 'buffer/'
import { DecodingError } from './errors'
import * as bech32 from 'bech32'
import bs58 from 'bs58'
import { sha256 } from './crypto'
import { JuneoBuffer } from './bytes'

function concatChecksum (buffer: JuneoBuffer): JuneoBuffer {
  const hashBuffer: JuneoBuffer = sha256(buffer).copyOf(28, 32)
  return JuneoBuffer.concat([buffer, hashBuffer])
}

export function verifyChecksum (value: JuneoBuffer): boolean {
  if (value.length < 5) {
    return false
  }
  const buffer: JuneoBuffer = value.copyOf(0, value.length - 4)
  return value.toHex() === concatChecksum(buffer).toHex()
}

export function encodeBech32 (hrp: string, buffer: JuneoBuffer): string {
  return bech32.bech32.encode(hrp, bech32.bech32.toWords(buffer.getBytes()))
}

export function decodeBech32 (value: string): JuneoBuffer {
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
  return JuneoBuffer.fromBytes(
    Buffer.from(bech32.bech32.fromWords(bech32.bech32.decode(part).words))
  )
}

export function encodeCB58 (buffer: JuneoBuffer): string {
  return bs58.encode(concatChecksum(buffer).getBytes())
}

export function isBase58 (value: string): boolean {
  return /^[A-HJ-NP-Za-km-z1-9]*$/.test(value)
}

export function decodeCB58 (value: string): JuneoBuffer {
  if (!isBase58(value)) {
    throw new DecodingError('value is not base58')
  }
  const buffer: JuneoBuffer = JuneoBuffer.fromBytes(
    Buffer.from(bs58.decode(value))
  )
  if (!verifyChecksum(buffer)) {
    throw new DecodingError('value checksum is not valid')
  }
  return buffer.copyOf(0, buffer.length - 4)
}

export function encodeCHex (buffer: JuneoBuffer): string {
  return `0x${concatChecksum(buffer).toHex()}`
}

export function isHex (value: string): boolean {
  const hasPrefix: boolean = hasHexPrefix(value)
  const regex = /[0-9A-Fa-f]/g
  return hasPrefix ? regex.test(value.substring(2)) : regex.test(value)
}

export function hasHexPrefix (value: string): boolean {
  return value.length > 2 && value.substring(0, 2) === '0x'
}

export function decodeHex (value: string): JuneoBuffer {
  if (!isHex(value)) {
    throw new DecodingError('value is not hexadecimal')
  }
  let hex: string = value
  if (hasHexPrefix(hex)) {
    hex = hex.substring(2)
  }
  return JuneoBuffer.fromString(hex, 'hex')
}

export function decodeCHex (value: string): JuneoBuffer {
  const buffer: JuneoBuffer = decodeHex(value)
  if (!verifyChecksum(buffer)) {
    throw new DecodingError('value checksum is not valid')
  }
  return buffer.copyOf(0, buffer.length - 4)
}
