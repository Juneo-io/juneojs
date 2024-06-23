import { BytesData, JuneoBuffer, JuneoTypeError } from '../utils'
import * as encoding from '../utils/encoding'
import {
  AddressSize,
  AssetIdSize,
  BlockchainIdSize,
  BLSPublicKeySize,
  BLSSignatureSize,
  DynamicIdSize,
  NodeIdSize,
  SignatureSize,
  SupernetIdSize,
  TransactionIdSize
} from './constants'

function validateData (data: any): void {
  if (data === undefined || data === null) {
    throw new JuneoTypeError(`invalid byte data type: ${data}`)
  }
}

export class Address extends BytesData {
  constructor (address: string | JuneoBuffer) {
    validateData(address)
    const buffer: JuneoBuffer = typeof address === 'string' ? Address.decodeAddress(address) : address
    if (buffer.length !== AddressSize) {
      throw new JuneoTypeError(`address is not ${AddressSize} bytes long`)
    }
    super(buffer)
  }

  matches (address: string | Address): boolean {
    validateData(address)
    const buffer: JuneoBuffer = typeof address === 'string' ? Address.decodeAddress(address) : address.getBuffer()
    if (buffer.length !== AddressSize) {
      throw new JuneoTypeError(`address is not ${AddressSize} bytes long`)
    }
    return JuneoBuffer.comparator(buffer, this.getBuffer()) === 0
  }

  matchesList (addresses: string[] | Address[]): boolean {
    for (const address of addresses) {
      if (this.matches(address)) {
        return true
      }
    }
    return false
  }

  static toAddresses (values: string[]): Address[] {
    if (values.length < 1) {
      throw new JuneoTypeError('provided values length should be greater than 0')
    }
    const addresses: Address[] = []
    for (const value of values) {
      addresses.push(new Address(value))
    }
    return addresses
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
    validateData(assetId)
    const buffer: JuneoBuffer = encoding.decodeCB58(assetId)
    if (buffer.length !== AssetIdSize) {
      throw new JuneoTypeError(`asset id is not ${AssetIdSize} bytes long`)
    }
    super(buffer)
    this.assetId = assetId
  }

  static validate (assetId: string): boolean {
    validateData(assetId)
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
    validateData(transactionId)
    const buffer: JuneoBuffer = encoding.decodeCB58(transactionId)
    if (buffer.length !== TransactionIdSize) {
      throw new JuneoTypeError(`transaction id is not ${TransactionIdSize} bytes long`)
    }
    super(buffer)
    this.transactionId = transactionId
  }
}

export class BlockchainId extends BytesData {
  blockchainId: string

  constructor (blockchainId: string) {
    validateData(blockchainId)
    const buffer: JuneoBuffer = encoding.decodeCB58(blockchainId)
    if (buffer.length !== BlockchainIdSize) {
      throw new JuneoTypeError(`blockchain id is not ${BlockchainIdSize} bytes long`)
    }
    super(buffer)
    this.blockchainId = blockchainId
  }
}

export class Signature extends BytesData {
  constructor (signature: JuneoBuffer) {
    validateData(signature)
    if (signature.length !== SignatureSize) {
      throw new JuneoTypeError(`signature is not ${SignatureSize} bytes long`)
    }
    super(signature)
  }
}

export class NodeId extends BytesData {
  nodeId: string

  constructor (nodeId: string) {
    validateData(nodeId)
    const split: string[] = nodeId.split('-')
    const parsedNodeId = split.length > 1 ? split[1] : split[0]
    const buffer: JuneoBuffer = encoding.decodeCB58(parsedNodeId)
    if (buffer.length !== NodeIdSize) {
      throw new JuneoTypeError(`node id is not ${NodeIdSize} bytes long`)
    }
    super(buffer)
    this.nodeId = parsedNodeId
  }
}

export class SupernetId extends BytesData {
  supernetId: string

  constructor (supernetId: string) {
    validateData(supernetId)
    const buffer: JuneoBuffer = encoding.decodeCB58(supernetId)
    if (buffer.length !== SupernetIdSize) {
      throw new JuneoTypeError(`supernet id is not ${SupernetIdSize} bytes long`)
    }
    super(buffer)
    this.supernetId = supernetId
  }
}

export class DynamicId extends BytesData {
  value: string

  constructor (value: string) {
    validateData(value)
    const buffer: JuneoBuffer = JuneoBuffer.alloc(DynamicIdSize)
    if (value.length > buffer.length) {
      throw new JuneoTypeError(`${value} is longer than ${DynamicIdSize} bytes`)
    }
    buffer.writeString(value)
    super(buffer)
    this.value = value
  }
}

export class BLSPublicKey extends BytesData {
  publicKey: string

  constructor (publicKey: string) {
    validateData(publicKey)
    const buffer: JuneoBuffer = encoding.decodeHex(publicKey)
    if (buffer.length !== BLSPublicKeySize) {
      throw new JuneoTypeError(`bls public key is not ${BLSPublicKeySize} bytes long`)
    }
    super(buffer)
    this.publicKey = publicKey
  }
}

export class BLSSignature extends BytesData {
  signature: string

  constructor (signature: string) {
    validateData(signature)
    const buffer: JuneoBuffer = encoding.decodeHex(signature)
    if (buffer.length !== BLSSignatureSize) {
      throw new JuneoTypeError(`bls signature is not ${BLSSignatureSize} bytes long`)
    }
    super(buffer)
    this.signature = signature
  }
}
