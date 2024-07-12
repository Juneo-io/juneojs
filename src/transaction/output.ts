import { JuneoBuffer, ParsingError, type Serializable } from '../utils'
import {
  AddressSize,
  AssetIdSize,
  Secp256k1OutputOwnersTypeId,
  Secp256k1OutputTypeId,
  StakeableLockedOutputTypeId,
  TransactionIdSize
} from './constants'
import { Address, AssetId, TransactionId } from './types'

export class Utxo {
  transactionId: TransactionId
  utxoIndex: number
  assetId: AssetId
  output: TransactionOutput
  sourceChain?: string

  constructor (transactionId: TransactionId, utxoIndex: number, assetId: AssetId, output: TransactionOutput) {
    this.transactionId = transactionId
    this.utxoIndex = utxoIndex
    this.assetId = assetId
    this.output = output
  }

  getUniqueId (): string {
    return `${this.transactionId.value}_${this.utxoIndex}}`
  }

  static parse (data: string | JuneoBuffer): Utxo {
    let buffer = JuneoBuffer.from(data)
    // The data could be provided with a codec, if it is a string then
    // we assume that there are extra codec bytes at the beginning and skip it.
    if (typeof data === 'string') {
      buffer = buffer.copyOf(2, buffer.length)
    }
    const reader = buffer.createReader()
    const transactionId = new TransactionId(reader.read(TransactionIdSize).toCB58())
    const utxoIndex = reader.readUInt32()
    const assetId = new AssetId(reader.read(AssetIdSize).toCB58())
    const outputBuffer = reader.readRemaining()
    const output = TransferableOutput.parseOutput(outputBuffer)
    return new Utxo(transactionId, utxoIndex, assetId, output)
  }
}

export class TransferableOutput implements Serializable {
  assetId: AssetId
  output: TransactionOutput

  constructor (assetId: AssetId, output: TransactionOutput) {
    this.assetId = assetId
    this.output = output
  }

  serialize (): JuneoBuffer {
    const outputBuffer = this.output.serialize()
    const buffer = JuneoBuffer.alloc(AssetIdSize + outputBuffer.length)
    buffer.write(this.assetId)
    buffer.write(outputBuffer)
    return buffer
  }

  static comparator = (a: TransferableOutput, b: TransferableOutput): number => {
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
  }

  static parse (data: string | JuneoBuffer): TransferableOutput {
    const reader = JuneoBuffer.from(data).createReader()
    const assetId = new AssetId(reader.read(AssetIdSize).toCB58())
    return new TransferableOutput(assetId, this.parseOutput(reader.readRemaining()))
  }

  static parseOutput (data: string | JuneoBuffer): TransactionOutput {
    const reader = JuneoBuffer.from(data).createReader()
    const typeId = reader.readUInt32()
    switch (typeId) {
      case Secp256k1OutputTypeId: {
        return Secp256k1Output.parse(data)
      }
      case Secp256k1OutputOwnersTypeId: {
        return Secp256k1OutputOwners.parse(data)
      }
      case StakeableLockedOutputTypeId: {
        return StakeableLockedOutput.parse(data)
      }
      default: {
        throw new ParsingError(`unsupported output type id "${typeId}"`)
      }
    }
  }
}

export class UserOutput extends TransferableOutput {
  isChange: boolean

  constructor (assetId: AssetId, output: TransactionOutput, isChange: boolean) {
    super(assetId, output)
    this.isChange = isChange
  }
}

export interface TransactionOutput extends Serializable {
  typeId: number
  locktime: bigint
  threshold: number
  addresses: Address[]
}

export class Secp256k1Output implements TransactionOutput {
  readonly typeId = Secp256k1OutputTypeId
  amount: bigint
  locktime: bigint
  threshold: number
  addresses: Address[]

  constructor (amount: bigint, locktime: bigint, threshold: number, addresses: Address[]) {
    this.amount = amount
    this.locktime = locktime
    this.threshold = threshold
    this.addresses = addresses.sort(Address.comparator)
  }

  serialize (): JuneoBuffer {
    const buffer = JuneoBuffer.alloc(
      // 4 + 8 + 8 + 4 + 4 = 28
      28 + AddressSize * this.addresses.length
    )
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt64(this.amount)
    buffer.writeUInt64(this.locktime)
    buffer.writeUInt32(this.threshold)
    buffer.writeUInt32(this.addresses.length)
    for (const address of this.addresses) {
      buffer.write(address)
    }
    return buffer
  }

  static parse (data: string | JuneoBuffer): Secp256k1Output {
    const reader = JuneoBuffer.from(data).createReader()
    reader.readAndVerifyTypeId(Secp256k1OutputTypeId)
    const amount = reader.readUInt64()
    const locktime = reader.readUInt64()
    const threshold = reader.readUInt32()
    const addressesCount = reader.readUInt32()
    const addresses: Address[] = []
    for (let i = 0; i < addressesCount; i++) {
      const address = new Address(reader.read(AddressSize))
      addresses.push(address)
    }
    return new Secp256k1Output(amount, locktime, threshold, addresses)
  }
}

export class Secp256k1OutputOwners implements TransactionOutput {
  readonly typeId = Secp256k1OutputOwnersTypeId
  locktime: bigint
  threshold: number
  addresses: Address[]

  constructor (locktime: bigint, threshold: number, addresses: Address[]) {
    this.locktime = locktime
    this.threshold = threshold
    this.addresses = addresses.sort(Address.comparator)
  }

  serialize (): JuneoBuffer {
    const buffer = JuneoBuffer.alloc(
      // 4 + 8 + 4 + 4 = 20
      20 + AddressSize * this.addresses.length
    )
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt64(this.locktime)
    buffer.writeUInt32(this.threshold)
    buffer.writeUInt32(this.addresses.length)
    for (const address of this.addresses) {
      buffer.write(address)
    }
    return buffer
  }

  static parse (data: string | JuneoBuffer): Secp256k1OutputOwners {
    const reader = JuneoBuffer.from(data).createReader()
    reader.readAndVerifyTypeId(Secp256k1OutputOwnersTypeId)
    const locktime = reader.readUInt64()
    const threshold = reader.readUInt32()
    const addressesCount = reader.readUInt32()
    const addresses: Address[] = []
    for (let i = 0; i < addressesCount; i++) {
      const address = new Address(reader.read(AddressSize))
      addresses.push(address)
    }
    return new Secp256k1OutputOwners(locktime, threshold, addresses)
  }
}

export class StakeableLockedOutput implements TransactionOutput {
  readonly typeId = StakeableLockedOutputTypeId
  locktime: bigint
  amount: bigint
  threshold: number
  addresses: Address[]

  constructor (locktime: bigint, amount: bigint, threshold: number, addresses: Address[]) {
    this.locktime = locktime
    this.amount = amount
    this.threshold = threshold
    this.addresses = addresses.sort(Address.comparator)
  }

  serialize (): JuneoBuffer {
    const buffer = JuneoBuffer.alloc(
      // 4 + 8 + 4 + 8 + 8 + 4 + 4 = 40
      40 + AddressSize * this.addresses.length
    )
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt64(this.locktime)
    const transferableOutput = new Secp256k1Output(this.amount, this.locktime, this.threshold, this.addresses)
    buffer.write(transferableOutput)
    return buffer
  }

  static parse (data: string | JuneoBuffer): StakeableLockedOutput {
    const reader = JuneoBuffer.from(data).createReader()
    reader.readAndVerifyTypeId(StakeableLockedOutputTypeId)
    const locktime = reader.readUInt64()
    const output = Secp256k1Output.parse(reader.readRemaining())
    return new StakeableLockedOutput(output.amount, locktime, output.threshold, output.addresses)
  }
}
