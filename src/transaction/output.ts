import { JuneoBuffer, ParsingError, type Serializable } from '../utils'
import { AddressSize, AssetIdSize, Secp256k1OutputTypeId, TransactionIdSize } from './constants'
import { Address, AssetId, TransactionId } from './types'

export class TransferableOutput implements Serializable {
  assetId: AssetId
  output: TransactionOutput

  constructor (assetId: AssetId, output: TransactionOutput) {
    this.assetId = assetId
    this.output = output
  }

  serialize (): JuneoBuffer {
    const outputBuffer: JuneoBuffer = this.output.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(AssetIdSize + outputBuffer.length)
    buffer.write(this.assetId.serialize())
    buffer.write(outputBuffer)
    return buffer
  }

  static comparator = (a: TransferableOutput, b: TransferableOutput): number => {
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
  }

  static parse (data: string | JuneoBuffer): TransferableOutput {
    const buffer: JuneoBuffer = typeof data === 'string' ? JuneoBuffer.fromString(data) : data
    // start at 2 to skip codec if from string from api
    let position: number = typeof data === 'string' ? 2 : 0
    const assetId: JuneoBuffer = buffer.read(position, AssetIdSize)
    position += AssetIdSize
    return new TransferableOutput(
      new AssetId(assetId.toCB58()),
      this.parseOutput(buffer.read(position, buffer.length - position))
    )
  }

  static parseOutput (data: string | JuneoBuffer): TransactionOutput {
    const buffer: JuneoBuffer = typeof data === 'string' ? JuneoBuffer.fromString(data) : data
    const typeId: number = buffer.readUInt32(0)
    if (typeId === Secp256k1OutputTypeId) {
      return Secp256k1Output.parse(data)
    } else {
      throw new ParsingError(`unsupported output type id "${typeId}"`)
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
  readonly typeId: number = Secp256k1OutputTypeId
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
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 4 + 8 + 8 + 4 + 4 = 28
      28 + AddressSize * this.addresses.length
    )
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt64(this.amount)
    buffer.writeUInt64(this.locktime)
    buffer.writeUInt32(this.threshold)
    buffer.writeUInt32(this.addresses.length)
    for (const address of this.addresses) {
      buffer.write(address.serialize())
    }
    return buffer
  }

  static parse (data: string | JuneoBuffer): Secp256k1Output {
    const buffer: JuneoBuffer = typeof data === 'string' ? JuneoBuffer.fromString(data) : data
    // start at 4 to skip type id reading
    let position: number = 4
    const amount: bigint = buffer.readUInt64(position)
    position += 8
    const locktime: bigint = buffer.readUInt64(position)
    position += 8
    const threshold: number = buffer.readUInt32(position)
    position += 4
    const addressesCount: number = buffer.readUInt32(position)
    position += 4
    const addresses: Address[] = []
    for (let i = 0; i < addressesCount; i++) {
      const address: Address = new Address(buffer.read(position, AddressSize))
      position += AddressSize
      addresses.push(address)
    }
    return new Secp256k1Output(amount, locktime, threshold, addresses)
  }
}

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

  static parse (data: string): Utxo {
    const buffer: JuneoBuffer = JuneoBuffer.fromString(data)
    let position: number = 0
    // skip codec reading
    position += 2
    const transactionId: TransactionId = new TransactionId(buffer.read(position, TransactionIdSize).toCB58())
    position += TransactionIdSize
    const utxoIndex: number = buffer.readUInt32(position)
    position += 4
    const assetId: AssetId = new AssetId(buffer.read(position, AssetIdSize).toCB58())
    position += AssetIdSize
    const outputBuffer: JuneoBuffer = buffer.read(position, buffer.length - position)
    const output: TransactionOutput = TransferableOutput.parseOutput(outputBuffer)
    return new Utxo(transactionId, utxoIndex, assetId, output)
  }
}
