
import { Buffer } from 'buffer/'
import * as encoding from './encoding'
import { ParsingError } from './errors'

export interface Serializable {
  serialize: () => JuneoBuffer
}

export abstract class BytesData implements Serializable {
  protected readonly bytes: Buffer

  constructor (bytes: Buffer) {
    this.bytes = bytes
  }

  serialize (): JuneoBuffer {
    return JuneoBuffer.fromBytes(this.bytes)
  }

  static comparator = (a: BytesData, b: BytesData): number => a.bytes.compare(b.bytes)
}

/**
 * Buffer wrapper that has methods compatible with the Juneo platform encoding format.
 *
 * Bytes are in big endian format and can be encoded/decoded in CHex or CB58
 */
export class JuneoBuffer {
  private bytes: Buffer
  private cursor: number = 0
  length: number

  private constructor (length: number) {
    this.bytes = Buffer.alloc(length)
    this.length = length
  }

  write (data: JuneoBuffer): void {
    this.writeBuffer(data.bytes)
  }

  writeBuffer (data: Buffer): void {
    const written: Buffer = this.cursor === 0
      ? Buffer.alloc(0)
      : this.bytes.slice(0, this.cursor)
    this.bytes = Buffer.concat([written, data], this.bytes.length)
    this.cursor += data.length
  }

  writeUInt16 (data: number): void {
    this.cursor = this.bytes.writeUInt16BE(data, this.cursor)
  }

  writeUInt32 (data: number): void {
    this.cursor = this.bytes.writeUInt32BE(data, this.cursor)
  }

  writeUInt64 (data: bigint): void {
    // because Buffer package does not support writing UInt64 using bigint type
    // we instead split the bigint into 8 bytes to write it
    // we must do that to keep 64 bits uint precision which would be lost by converting to number type
    // also bitwise operators are not the same for number and bigint so we are using strings
    const hex: string = data.toString(16).padStart(16, '0')
    for (let i: number = 0; i < hex.length; i += 2) {
      const byte: number = parseInt(hex.substring(i, i + 2), 16)
      this.cursor = this.bytes.writeUInt8(byte, this.cursor)
    }
  }

  writeString (data: string): void {
    this.cursor = this.bytes.write(data, this.cursor)
  }

  readUInt16 (index: number): number {
    return this.bytes.readUInt16BE(index)
  }

  readUInt32 (index: number): number {
    return this.bytes.readUInt32BE(index)
  }

  readUInt64 (index: number): bigint {
    // we have the same issue as for writeUInt64 so we fix it here too
    let hex: string = '0x'
    for (let i: number = 0; i < 16; i += 2) {
      const byte: number = this.bytes.readUInt8(index + i)
      hex = hex.concat(byte.toString(16))
    }
    return BigInt(hex)
  }

  readString (index: number, length: number): string {
    return this.read(index, length).bytes.toString()
  }

  read (index: number, length: number): JuneoBuffer {
    return JuneoBuffer.fromBytes(this.bytes.slice(index, index + length))
  }

  toCB58 (): string {
    return encoding.encodeCB58(this.bytes)
  }

  toCHex (): string {
    return encoding.encodeCHex(this.bytes)
  }

  toBytes (): Buffer {
    return this.bytes
  }

  static alloc (size: number): JuneoBuffer {
    return new JuneoBuffer(size)
  }

  static fromBytes (bytes: Buffer): JuneoBuffer {
    const buffer: JuneoBuffer = new JuneoBuffer(bytes.length)
    buffer.writeBuffer(bytes)
    return buffer
  }

  static fromString (data: string, fromEncoding?: string): JuneoBuffer {
    const isHex: boolean = encoding.isHex(data)
    if (!isHex && !encoding.isBase58(data)) {
      throw new ParsingError('parsed data is not CHex or CB58')
    }
    return isHex ? JuneoBuffer.fromCHex(data) : JuneoBuffer.fromCB58(data)
  }

  static fromCB58 (cb58: string): JuneoBuffer {
    return JuneoBuffer.fromBytes(encoding.decodeCB58(cb58))
  }

  static fromCHex (cHex: string): JuneoBuffer {
    return JuneoBuffer.fromBytes(encoding.decodeCHex(cHex))
  }

  static comparator = (a: JuneoBuffer, b: JuneoBuffer): number => {
    return a.bytes.compare(b.bytes)
  }
}
