import * as encoding from './encoding'
import { CapacityError, ParsingError } from './errors'

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

  private constructor (size: number) {
    if (size < 0) {
      throw new CapacityError('cannot allocate negative size')
    }
    this.bytes = Buffer.alloc(size)
    this.length = size
  }

  getCursor (): number {
    return this.cursor
  }

  createReader (): JuneoReader {
    return new JuneoReader(this)
  }

  private verifyWriteIndexes (length: number): void {
    if (this.cursor + length > this.length) {
      throw new CapacityError(`writing at ${this.cursor} with length of ${length} to capacity of ${this.length}`)
    }
  }

  write (data: JuneoBuffer): void {
    this.writeBuffer(data.bytes)
  }

  writeBuffer (data: Buffer): void {
    this.verifyWriteIndexes(data.length)
    const written: Buffer = this.cursor === 0 ? Buffer.alloc(0) : this.bytes.subarray(0, this.cursor)
    this.bytes = Buffer.concat([written, data], this.length)
    this.cursor += data.length
  }

  writeUInt8 (data: number): void {
    this.verifyWriteIndexes(1)
    this.cursor = this.bytes.writeUInt8(data, this.cursor)
  }

  writeUInt16 (data: number): void {
    this.verifyWriteIndexes(2)
    this.cursor = this.bytes.writeUInt16BE(data, this.cursor)
  }

  writeUInt32 (data: number): void {
    this.verifyWriteIndexes(4)
    this.cursor = this.bytes.writeUInt32BE(data, this.cursor)
  }

  writeUInt64 (data: bigint): void {
    this.verifyWriteIndexes(8)
    this.cursor = this.bytes.writeBigUInt64BE(data, this.cursor)
  }

  writeString (data: string, encoding: BufferEncoding = 'utf8'): void {
    this.verifyWriteIndexes(data.length)
    // Buffer.write returns the amount of bytes written instead of the cursor
    this.cursor += this.bytes.write(data, this.cursor, encoding)
  }

  private verifyReadIndexes (index: number, length: number): void {
    if (index < 0) {
      throw new CapacityError(`cannot read at negative index but got ${index}`)
    }
    if (length < 1) {
      throw new CapacityError(`read length must be greater than 0 but got ${length}`)
    }
    if (index + length > this.length) {
      throw new CapacityError(`reading at ${index} with length of ${length} to capacity of ${this.length}`)
    }
    if (index === null || length === null) {
      throw new CapacityError(`cannot have null indices or length but got ${index} and ${length}`)
    }
  }

  readUInt8 (index: number): number {
    this.verifyReadIndexes(index, 1)
    return this.bytes.readUInt8(index)
  }

  readUInt16 (index: number): number {
    this.verifyReadIndexes(index, 2)
    return this.bytes.readUInt16BE(index)
  }

  readUInt32 (index: number): number {
    this.verifyReadIndexes(index, 4)
    return this.bytes.readUInt32BE(index)
  }

  readUInt64 (index: number): bigint {
    this.verifyReadIndexes(index, 8)
    return this.bytes.readBigUInt64BE(index)
  }

  readString (index: number, length: number, encoding: BufferEncoding = 'utf8'): string {
    this.verifyReadIndexes(index, length)
    return this.read(index, length).bytes.toString(encoding)
  }

  read (index: number, length: number): JuneoBuffer {
    this.verifyReadIndexes(index, length)
    return JuneoBuffer.fromBytes(this.bytes.subarray(index, index + length))
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

  copyOf (start: number = 0, end: number = this.length): JuneoBuffer {
    return this.read(start, end - start)
  }

  static alloc (size: number): JuneoBuffer {
    return new JuneoBuffer(size)
  }

  static concat (buffers: JuneoBuffer[]): JuneoBuffer {
    const data: Buffer[] = []
    let length: number = 0
    for (const buffer of buffers) {
      data.push(buffer.bytes)
      length += buffer.bytes.length
    }
    return JuneoBuffer.fromBytes(Buffer.concat(data, length))
  }

  static fromBytes (bytes: Buffer): JuneoBuffer {
    const buffer: JuneoBuffer = new JuneoBuffer(bytes.length)
    buffer.writeBuffer(bytes)
    return buffer
  }

  static fromString (data: string, fromEncoding?: string): JuneoBuffer {
    if (data === '') {
      throw new ParsingError('parsed data cannot be empty')
    }
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
      return encoding.hasHexPrefix(data)
        ? JuneoBuffer.fromBytes(Buffer.from(data.substring(2), 'hex'))
        : JuneoBuffer.fromBytes(Buffer.from(data, 'hex'))
    } else if (fromEncoding.toLowerCase() === 'chex') {
      return encoding.decodeCHex(data)
    } else if (fromEncoding.toLowerCase() === 'cb58') {
      return encoding.decodeCB58(data)
    } else {
      throw new ParsingError(`invalid encoding "${fromEncoding}" should be hex, cHex or CB58`)
    }
  }

  static from (data: JuneoBuffer | string): JuneoBuffer {
    if (typeof data === 'string') {
      return JuneoBuffer.fromString(data)
    }
    return data
  }

  static comparator = (a: JuneoBuffer, b: JuneoBuffer): number => {
    return a.bytes.compare(b.bytes)
  }
}

export class JuneoReader {
  private readonly buffer: JuneoBuffer
  private cursor: number = 0

  constructor (buffer: JuneoBuffer) {
    this.buffer = buffer
  }

  getCursor (): number {
    return this.cursor
  }

  skip (amount: number): void {
    this.cursor += amount
  }

  readUInt8 (): number {
    const value = this.buffer.readUInt8(this.cursor)
    this.cursor += 1
    return value
  }

  readUInt16 (): number {
    const value = this.buffer.readUInt16(this.cursor)
    this.cursor += 2
    return value
  }

  readUInt32 (): number {
    const value = this.buffer.readUInt32(this.cursor)
    this.cursor += 4
    return value
  }

  readUInt64 (): bigint {
    const value = this.buffer.readUInt64(this.cursor)
    this.cursor += 8
    return value
  }

  readString (length: number, encoding: BufferEncoding = 'utf8'): string {
    return this.read(length).getBytes().toString(encoding)
  }

  readAndVerifyTypeId (expectedTypeId: number): number {
    const typeId = this.readUInt32()
    if (typeId !== expectedTypeId) {
      throw new ParsingError(`invalid type id ${typeId} expected ${expectedTypeId}`)
    }
    return typeId
  }

  read (length: number): JuneoBuffer {
    const value = this.buffer.read(this.cursor, length)
    this.cursor += length
    return value
  }

  readRemaining (): JuneoBuffer {
    return this.read(this.buffer.length - this.cursor)
  }
}
