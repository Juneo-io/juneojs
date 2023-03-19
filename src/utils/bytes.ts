
import { Buffer } from 'buffer'
import * as encoding from './encoding'

export class JuneoBuffer {
  private readonly buffer: Buffer

  constructor (bytes: Buffer[], size: number) {
    this.buffer = Buffer.concat(bytes, size)
  }

  toCB58 (): string {
    return encoding.encodeCB58(this.buffer)
  }

  toCHex (): string {
    return encoding.encodeCHex(this.buffer)
  }

  fromCB58 (cb58: string): JuneoBuffer {
    const buff: Buffer = encoding.decodeCB58(cb58)
    return new JuneoBuffer([buff], buff.length)
  }

  fromCHex (cHex: string): JuneoBuffer {
    const buff: Buffer = encoding.decodeCHex(cHex)
    return new JuneoBuffer([buff], buff.length)
  }
}
