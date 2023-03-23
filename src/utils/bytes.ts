
import { Buffer } from 'buffer'
import * as encoding from './encoding'

export interface Serializable {
  serialize: () => JuneoBuffer
}

export abstract class BytesData implements Serializable {
  private readonly bytes: Buffer

  constructor (bytes: Buffer) {
    this.bytes = bytes
  }

  serialize (): JuneoBuffer {
    return JuneoBuffer.fromBuffer(this.bytes)
  }

  static comparator = (a: BytesData, b: BytesData): number => {
    return a.bytes.compare(b.bytes)
  }
}

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

  toCB58 (): string {
    return encoding.encodeCB58(this.bytes)
  }

  toCHex (): string {
    return encoding.encodeCHex(this.bytes)
  }

  static alloc (size: number): JuneoBuffer {
    return new JuneoBuffer(size)
  }

  static fromBuffer (bytes: Buffer): JuneoBuffer {
    const buffer: JuneoBuffer = new JuneoBuffer(bytes.length)
    buffer.writeBuffer(bytes)
    return buffer
  }

  static fromCB58 (cb58: string): JuneoBuffer {
    return JuneoBuffer.fromBuffer(encoding.decodeCB58(cb58))
  }

  static fromCHex (cHex: string): JuneoBuffer {
    return JuneoBuffer.fromBuffer(encoding.decodeCHex(cHex))
  }

  static comparator = (a: JuneoBuffer, b: JuneoBuffer): number => {
    return a.bytes.compare(b.bytes)
  }
}
