import {
  JuneoBuffer,
  ParsingError,
  publicKeyToAddress,
  recoverAddress,
  recoverPubKey,
  TransactionUtils,
  type Serializable
} from '../utils'
import { Secp256k1CredentialsTypeId, SignatureSize } from './constants'
import { type UnsignedTransaction } from './transaction'
import { Address, Signature } from './types'

export interface Signer {
  sign: (bytes: JuneoBuffer) => Promise<JuneoBuffer>
  matches: (address: Address) => boolean
}

export interface Signable {
  sign: (bytes: JuneoBuffer, signers: Signer[]) => Promise<Signature[]>
  getAddresses: () => Address[]
  getThreshold: () => number
}

export abstract class AbstractSignable implements Signable {
  async sign (bytes: JuneoBuffer, signers: Signer[]): Promise<Signature[]> {
    const addresses = this.getAddresses()
    const signatures: Signature[] = []
    for (let i = 0; i < this.getThreshold() && i < addresses.length; i++) {
      const address = addresses[i]
      for (const signer of signers) {
        if (signer.matches(address)) {
          const signature = await signer.sign(bytes)
          signatures.push(new Signature(signature))
          break
        }
      }
    }
    return signatures
  }

  abstract getAddresses (): Address[]

  abstract getThreshold (): number
}

export abstract class TransactionCredentials implements Serializable {
  typeId: number
  signatures: Signature[]

  constructor (typeId: number, signatures: Signature[]) {
    this.typeId = typeId
    this.signatures = signatures
  }

  recoverAddresses (message: JuneoBuffer, recovery: number): Address[] {
    const addresses: Address[] = []
    for (const signature of this.signatures) {
      const publicKey = recoverPubKey(signature.serialize(), message, recovery)
      addresses.push(new Address(publicKeyToAddress(publicKey)))
    }
    return addresses
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 4 + 4 = 8
      8 + SignatureSize * this.signatures.length
    )
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.signatures.length)
    for (const signature of this.signatures) {
      buffer.write(signature.serialize())
    }
    return buffer
  }

  static parse (data: string | JuneoBuffer): TransactionCredentials {
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    const typeId = reader.readUInt32()
    const signatures: Signature[] = []
    while (reader.getCursor() < buffer.length - SignatureSize) {
      signatures.push(new Signature(reader.read(SignatureSize)))
    }
    switch (typeId) {
      case Secp256k1CredentialsTypeId: {
        return new Secp256k1Credentials(signatures)
      }
      default: {
        throw new ParsingError(`unsupported credentials type id "${typeId}"`)
      }
    }
  }

  static comparator = (a: TransactionCredentials, b: TransactionCredentials): number => {
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
  }
}

export class Secp256k1Credentials extends TransactionCredentials {
  constructor (signatures: Signature[]) {
    super(Secp256k1CredentialsTypeId, signatures)
  }
}

class SignatureData {
  signature: Signature
  addresses: Address[]

  constructor (signature: Signature, addresses: Address[]) {
    this.signature = signature
    this.addresses = addresses
  }
}

export class SignedTransaction {
  unsignedTransaction: UnsignedTransaction
  credentials: TransactionCredentials[]

  constructor (unsignedTransaction: UnsignedTransaction, credentials: TransactionCredentials[]) {
    this.unsignedTransaction = unsignedTransaction
    this.credentials = credentials
  }

  /**
   * Verify if the signed transaction has enough signatures to be sent over the network.
   *
   * We expect that each address that has signed the transaction has effectively signed
   * all of the Signable components of it that they match. That way we can verify credentials
   * faster and more easily, as well as identifying missing ones. This should always be
   * the case if signatures functions are called within regular usage of juneojs.
   *
   * @return Address[] List of addresses of which at least a signature is missing.
   * If no signature is missing, then an empty list is returned.
   */
  verifySignatures (): Address[] {
    const missing: Address[] = []
    const signablesAddresses = this.getSignablesUniqueAddresses()
    const credentialsAddresses = this.getCredentialsUniqueAddresses()
    for (const address of signablesAddresses) {
      if (!address.matchesList(credentialsAddresses) && !address.matchesList(missing)) {
        missing.push(address)
      }
    }
    return missing
  }

  mergeCredentials (): void {
    const credentials: TransactionCredentials[] = []
    const signaturesData = this.getSignaturesData()
    for (const signable of this.unsignedTransaction.getSignables()) {
      for (const signableAddress of signable.getAddresses()) {
        const signatures: Signature[] = []
        for (const signatureData of signaturesData) {
          if (signableAddress.matchesList(signatureData.addresses)) {
            signatures.push(signatureData.signature)
          }
        }
        credentials.push(new Secp256k1Credentials(signatures))
      }
    }
    this.credentials = credentials
  }

  getSignablesUniqueAddresses (): Address[] {
    const addresses: Address[] = []
    for (const signable of this.unsignedTransaction.getSignables()) {
      for (const address of signable.getAddresses()) {
        if (!address.matchesList(addresses)) {
          addresses.push(address)
        }
      }
    }
    return addresses
  }

  getCredentialsUniqueAddresses (): Address[] {
    const addresses: Address[] = []
    const message = this.unsignedTransaction.serialize()
    for (const credential of this.credentials) {
      for (const address of credential.recoverAddresses(message, 0)) {
        if (!address.matchesList(addresses)) {
          addresses.push(address)
        }
      }
      for (const address of credential.recoverAddresses(message, 1)) {
        if (!address.matchesList(addresses)) {
          addresses.push(address)
        }
      }
    }
    return addresses
  }

  private getSignaturesData (): SignatureData[] {
    const message = this.unsignedTransaction.serialize()
    const signaturesData: SignatureData[] = []
    for (const credential of this.credentials) {
      const addresses: Address[] = []
      for (const signature of credential.signatures) {
        addresses.push(
          ...[recoverAddress(signature.serialize(), message, 0), recoverAddress(signature.serialize(), message, 1)]
        )
        signaturesData.push(new SignatureData(signature, addresses))
      }
    }
    return signaturesData
  }

  serialize (): JuneoBuffer {
    const bytes = this.unsignedTransaction.serialize()
    const credentials: JuneoBuffer[] = []
    let credentialsSize: number = 0
    for (const credential of this.credentials) {
      const credentialBytes = credential.serialize()
      credentialsSize += credentialBytes.length
      credentials.push(credentialBytes)
    }
    const buffer = JuneoBuffer.alloc(bytes.length + 4 + credentialsSize)
    buffer.write(bytes)
    buffer.writeUInt32(credentials.length)
    credentials.sort(JuneoBuffer.comparator)
    for (const credential of credentials) {
      buffer.write(credential)
    }
    return buffer
  }

  static parse (data: string | JuneoBuffer): SignedTransaction {
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    const unsignedTransaction = TransactionUtils.parseUnsignedTransaction(data)
    reader.skip(unsignedTransaction.serialize().length)
    const credentials: TransactionCredentials[] = []
    const credentialsLength = reader.readUInt32()
    for (let i = 0; i < credentialsLength; i++) {
      credentials.push(
        TransactionCredentials.parse(buffer.read(reader.getCursor(), buffer.length - reader.getCursor()))
      )
    }
    return new SignedTransaction(unsignedTransaction, credentials)
  }
}
