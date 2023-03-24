
import { Buffer } from 'buffer'
import * as encoding from './encoding'

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

  static comparator = (a: BytesData, b: BytesData): number => {
    return a.bytes.compare(b.bytes)
  }
}

/**
 * Buffer wrapper that has methods compatible with the Juneo platform encoding format.
 * 
 * Bytes are in big endian format and can be encoded/decoded in CHex or CB58
 */
export class JuneoBuffer {
  private readonly bytes: Buffer
  length: number

  private constructor (length: number) {
    this.bytes = Buffer.alloc(length)
    this.length = length
  }

  write (data: JuneoBuffer): void {
    this.writeBuffer(data.bytes)
  }

  writeBuffer (data: Buffer): void {
    this.bytes.write(data.toString())
  }

  writeUInt16 (data: number): void {
    this.bytes.writeUInt16BE(data)
  }

  writeUInt32 (data: number): void {
    this.bytes.writeUInt32BE(data)
  }

  writeUInt64 (data: bigint): void {
    this.bytes.writeBigUInt64BE(data)
  }

  writeString (data: string): void {
    this.bytes.write(data)
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
