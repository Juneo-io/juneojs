import { type Buffer } from 'buffer'
import { BytesData, type JuneoBuffer } from '../utils/bytes'
import { TypeError } from '../utils/errors'
import * as encoding from '../utils/encoding'
import { SignatureLength } from '../utils'

export const AddressSize: number = 20
export const AssetIdSize: number = 32
export const TransactionIdSize: number = 32
export const BlockchainIdSize: number = 32
export const SignatureSize: number = SignatureLength

export class Address extends BytesData {
  constructor (address: string | JuneoBuffer) {
    const bytes: Buffer = typeof address === 'string'
      ? encoding.decodeBech32(address)
      : address.toBytes()
    if (bytes.length !== AddressSize) {
      throw new TypeError(`address is not ${AddressSize} bytes long`)
    }
    super(bytes)
  }

  matches (address: string): boolean {
    const bytes: Buffer = encoding.decodeBech32(address)
    if (bytes.length !== AddressSize) {
      throw new TypeError(`address is not ${AddressSize} bytes long`)
    }
    return bytes.compare(this.bytes) === 0
  }
}

export class AssetId extends BytesData {
  assetId: string

  constructor (assetId: string) {
    const bytes = encoding.decodeCB58(assetId)
    if (bytes.length !== AssetIdSize) {
      throw new TypeError(`asset id is not ${AssetIdSize} bytes long`)
    }
    super(bytes)
    this.assetId = assetId
  }
}

export class TransactionId extends BytesData {
  transactionId: string

  constructor (transactionId: string) {
    const bytes = encoding.decodeCB58(transactionId)
    if (bytes.length !== TransactionIdSize) {
      throw new TypeError(`transaction id is not ${TransactionIdSize} bytes long`)
    }
    super(bytes)
    this.transactionId = transactionId
  }
}

export class BlockchainId extends BytesData {
  blockchainId: string

  constructor (blockchainId: string) {
    const bytes = encoding.decodeCB58(blockchainId)
    if (bytes.length !== BlockchainIdSize) {
      throw new TypeError(`blockchain id is not ${BlockchainIdSize} bytes long`)
    }
    super(bytes)
    this.blockchainId = blockchainId
  }
}

export class Signature extends BytesData {
  constructor (signature: Buffer) {
    if (signature.length !== SignatureSize) {
      throw new TypeError(`signature is not ${SignatureSize} bytes long`)
    }
    super(signature)
  }
}
