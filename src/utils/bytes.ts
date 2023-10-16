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

  private constructor (length: number) {
    if (length < 0) {
      throw new CapacityError('cannot allocate negative length')
    }
    this.bytes = Buffer.alloc(length)
    this.length = length
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

  writeString (data: string): void {
    this.verifyWriteIndexes(data.length)
    // Buffer.write returns the amount of bytes written instead of the cursor
    this.cursor += this.bytes.write(data, this.cursor)
  }

  private verifyReadIndexes (index: number, length: number): void {
    if (index < 0) {
      throw new CapacityError(`cannot read at negative index ${index}`)
    }
    if (index + length > this.length) {
      throw new CapacityError(`reading at ${index} with length of ${length} to capacity of ${this.length}`)
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

  readString (index: number, length: number): string {
    this.verifyReadIndexes(index, length)
    return this.read(index, length).bytes.toString()
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

  copyOf (start?: number, end?: number): JuneoBuffer {
    const buffer: Buffer = this.bytes.subarray(start, end)
    return JuneoBuffer.fromBytes(buffer)
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
