import { Buffer } from 'buffer/'
import * as encoding from './encoding'
import { ParsingError } from './errors'

export interface Serializable {
  serialize: () => JuneoBuffer
}

export abstract class BytesData implements Serializable {
  private readonly buffer: JuneoBuffer
  private readonly bytes: Buffer

  constructor (buffer: JuneoBuffer) {
    this.buffer = buffer
    this.bytes = this.buffer.getBytes()
  }

  protected getBuffer (): JuneoBuffer {
    return this.buffer
  }

  serialize (): JuneoBuffer {
    return JuneoBuffer.fromBytes(this.bytes)
  }

  static comparator = (a: BytesData, b: BytesData): number => a.bytes.compare(b.bytes)
}

/**
 * Buffer wrapper that has methods compatible with the Juneo platform encoding format.
 *
 * Bytes are in big endian format and can be encoded/decoded in hex, CHex or CB58
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
    // Buffer.write returns the amount of bytes written instead of the cursor
    this.cursor += this.bytes.write(data, this.cursor)
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
    for (let i: number = 0; i < 8; i += 1) {
      const byte: number = this.bytes.readUInt8(index + i)
      hex = hex.concat(byte.toString(16).padStart(2, '0'))
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
    return encoding.encodeCB58(this)
  }

  toCHex (): string {
    return encoding.encodeCHex(this)
  }

  toHex (): string {
    return this.bytes.toString('hex')
  }

  getBytes (): Buffer {
    return Buffer.from(this.bytes)
  }

  copyOf (start?: number, end?: number): JuneoBuffer {
    const buffer: Buffer = this.bytes.slice(start, end)
    return JuneoBuffer.fromBytes(buffer)
  }

  static alloc (size: number): JuneoBuffer {
    return new JuneoBuffer(size)
  }

  static concat (buffers: JuneoBuffer[]): JuneoBuffer {
    const data: Buffer[] = []
    let length: number = 0
    buffers.forEach(buffer => {
      data.push(buffer.bytes)
      length += buffer.bytes.length
    })
    return JuneoBuffer.fromBytes(Buffer.concat(data, length))
  }

  static fromBytes (bytes: Buffer): JuneoBuffer {
    const buffer: JuneoBuffer = new JuneoBuffer(bytes.length)
    buffer.writeBuffer(bytes)
    return buffer
  }

  static fromString (data: string, fromEncoding?: string): JuneoBuffer {
    if (fromEncoding === undefined) {
      const isHex: boolean = encoding.isHex(data)
      if (isHex) {
        const hasChecksum: boolean = encoding.verifyChecksum(encoding.decodeHex(data))
        fromEncoding = hasChecksum ? 'cHex' : 'hex'
      } else if (encoding.isBase58(data)) {
        fromEncoding = 'CB58'
      } else {
        throw new ParsingError('parsed data is not hex, cHex or CB58')
      }
    }
    if (fromEncoding.toLowerCase() === 'hex') {
      return JuneoBuffer.fromBytes(Buffer.from(data, 'hex'))
    } else if (fromEncoding.toLowerCase() === 'chex') {
      return encoding.decodeCHex(data)
    } else if (fromEncoding.toLowerCase() === 'cb58') {
      return encoding.decodeCB58(data)
    } else {
      throw new ParsingError(`invalid encoding "${fromEncoding}" should be hex, cHex or CB58`)
    }
  }

  static comparator = (a: JuneoBuffer, b: JuneoBuffer): number => {
    return a.bytes.compare(b.bytes)
  }
}
