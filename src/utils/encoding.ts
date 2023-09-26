import { Buffer } from 'buffer/'
import { DecodingError } from './errors'
import * as bech32 from 'bech32'
import bs58 from 'bs58'
import { sha256 } from './crypto'
import { JuneoBuffer } from './bytes'

const HexPrefix: string = '0x'

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

export function validateBech32 (value: string, expectedHrp?: string, expectedPrefix: string[] = []): boolean {
  const parts: string[] = value.split('-')
  if (parts.length < 1) {
    return false
  }
  if (!expectedPrefix.includes(parts[0])) {
    return false
  }
  const bech32: string = parts[1]
  try {
    decodeBech32(bech32)
  } catch (error) {
    return false
  }
  if (expectedHrp === undefined) {
    return true
  }
  const hrp: string = bech32.slice(0, bech32.lastIndexOf('1'))
  return hrp === expectedHrp
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
  return `${HexPrefix}${concatChecksum(buffer).toHex()}`
}

export function isHex (value: string): boolean {
  const hex: string = hasHexPrefix(value) ? value.substring(2) : value
  return /^[0-9A-Fa-f]*$/.test(hex)
}

export function hasHexPrefix (value: string): boolean {
  return value.startsWith(HexPrefix)
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
