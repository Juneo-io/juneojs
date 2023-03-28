import { BytesData, JuneoBuffer } from '../utils/bytes'
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
    const buffer: JuneoBuffer = typeof address === 'string'
      ? encoding.decodeBech32(address)
      : address
    if (buffer.length !== AddressSize) {
      throw new TypeError(`address is not ${AddressSize} bytes long`)
    }
    super(buffer)
  }

  matches (address: string | Address): boolean {
    const buffer: JuneoBuffer = typeof address === 'string'
      ? encoding.decodeBech32(address)
      : address.getBuffer()
    if (buffer.length !== AddressSize) {
      throw new TypeError(`address is not ${AddressSize} bytes long`)
    }
    return JuneoBuffer.comparator(buffer, this.getBuffer()) === 0
  }
}

export class AssetId extends BytesData {
  assetId: string

  constructor (assetId: string) {
    const buffer = encoding.decodeCB58(assetId)
    if (buffer.length !== AssetIdSize) {
      throw new TypeError(`asset id is not ${AssetIdSize} bytes long`)
    }
    super(buffer)
    this.assetId = assetId
  }
}

export class TransactionId extends BytesData {
  transactionId: string

  constructor (transactionId: string) {
    const buffer = encoding.decodeCB58(transactionId)
    if (buffer.length !== TransactionIdSize) {
      throw new TypeError(`transaction id is not ${TransactionIdSize} bytes long`)
    }
    super(buffer)
    this.transactionId = transactionId
  }
}

export class BlockchainId extends BytesData {
  blockchainId: string

  constructor (blockchainId: string) {
    const buffer = encoding.decodeCB58(blockchainId)
    if (buffer.length !== BlockchainIdSize) {
      throw new TypeError(`blockchain id is not ${BlockchainIdSize} bytes long`)
    }
    super(buffer)
    this.blockchainId = blockchainId
  }
}

export class Signature extends BytesData {
  constructor (signature: JuneoBuffer) {
    if (signature.length !== SignatureSize) {
      throw new TypeError(`signature is not ${SignatureSize} bytes long`)
    }
    super(signature)
  }
}