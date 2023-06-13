import { BytesData, JuneoBuffer } from '../utils/bytes'
import { TypeError } from '../utils/errors'
import * as encoding from '../utils/encoding'
import { SignatureLength } from '../utils'

export const AddressSize: number = 20
export const AssetIdSize: number = 32
export const TransactionIdSize: number = 32
export const BlockchainIdSize: number = 32
export const SupernetIdSize: number = 32
export const DynamicIdSize: number = 32
export const SignatureSize: number = SignatureLength
export const NodeIdSize: number = 20

export class Address extends BytesData {
  constructor (address: string | JuneoBuffer) {
    const buffer: JuneoBuffer = typeof address === 'string'
      ? Address.decodeAddress(address)
      : address
    if (buffer.length !== AddressSize) {
      throw new TypeError(`address is not ${AddressSize} bytes long`)
    }
    super(buffer)
  }

  matches (address: string | Address): boolean {
    const buffer: JuneoBuffer = typeof address === 'string'
      ? Address.decodeAddress(address)
      : address.getBuffer()
    if (buffer.length !== AddressSize) {
      throw new TypeError(`address is not ${AddressSize} bytes long`)
    }
    return JuneoBuffer.comparator(buffer, this.getBuffer()) === 0
  }

  private static decodeAddress (address: string): JuneoBuffer {
    if (encoding.isHex(address)) {
      return encoding.decodeHex(address)
    } else {
      return encoding.decodeBech32(address)
    }
  }
}

export class AssetId extends BytesData {
  assetId: string

  constructor (assetId: string) {
    const buffer: JuneoBuffer = encoding.decodeCB58(assetId)
    if (buffer.length !== AssetIdSize) {
      throw new TypeError(`asset id is not ${AssetIdSize} bytes long`)
    }
    super(buffer)
    this.assetId = assetId
  }

  static validate (assetId: string): boolean {
    if (!encoding.isBase58(assetId)) {
      return false
    }
    const buffer: JuneoBuffer = encoding.decodeCB58(assetId)
    return buffer.length === AssetIdSize
  }
}

export class TransactionId extends BytesData {
  transactionId: string

  constructor (transactionId: string) {
    const buffer: JuneoBuffer = encoding.decodeCB58(transactionId)
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
    const buffer: JuneoBuffer = encoding.decodeCB58(blockchainId)
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

export class NodeId extends BytesData {
  nodeId: string

  constructor (nodeId: string) {
    const split: string[] = nodeId.split('-')
    const parsedNodeId = split.length > 1 ? split[1] : split[0]
    const buffer: JuneoBuffer = encoding.decodeCB58(parsedNodeId)
    if (buffer.length !== NodeIdSize) {
      throw new TypeError(`node id is not ${NodeIdSize} bytes long`)
    }
    super(buffer)
    this.nodeId = parsedNodeId
  }
}

export class SupernetId extends BytesData {
  supernetId: string

  constructor (supernetId: string) {
    const buffer: JuneoBuffer = encoding.decodeCB58(supernetId)
    if (buffer.length !== SupernetIdSize) {
      throw new TypeError(`supernet id is not ${SupernetIdSize} bytes long`)
    }
    super(buffer)
    this.supernetId = supernetId
  }
}

export class DynamicId extends BytesData {
  value: string

  constructor (value: string) {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(DynamicIdSize)
    if (value.length > buffer.length) {
      throw new TypeError(`${value} is longer than ${DynamicIdSize} bytes`)
    }
    buffer.writeString(value)
    super(buffer)
    this.value = value
  }
}
