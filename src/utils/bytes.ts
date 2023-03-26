
import { Buffer } from 'buffer'
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
      : this.bytes.subarray(0, this.cursor)
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
    this.cursor = this.bytes.writeBigUInt64BE(data, this.cursor)
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
    return this.bytes.readBigUInt64BE(index)
  }

  readString (index: number, length: number): string {
    return this.read(index, length).bytes.toString()
  }

  read (index: number, length: number): JuneoBuffer {
    return JuneoBuffer.fromBytes(this.bytes.subarray(index, index + length))
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

  static fromString (data: string): JuneoBuffer {
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
