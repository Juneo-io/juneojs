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
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    const assetId = new AssetId(reader.read(AssetIdSize).toCB58())
    return new TransferableOutput(assetId, this.parseOutput(reader.read(buffer.length - reader.getCursor())))
  }

  static parseOutput (data: string | JuneoBuffer): TransactionOutput {
    const reader = JuneoBuffer.from(data).createReader()
    const typeId = reader.readUInt32()
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
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    const typeId = reader.readUInt32()
    if (typeId !== Secp256k1OutputTypeId) {
      throw new ParsingError(`invalid type id ${typeId} expected ${Secp256k1OutputTypeId}`)
    }
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

  static parse (data: string | JuneoBuffer): Utxo {
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    const transactionId = new TransactionId(reader.read(TransactionIdSize).toCB58())
    const utxoIndex = reader.readUInt32()
    const assetId = new AssetId(reader.read(AssetIdSize).toCB58())
    const outputBuffer = reader.read(buffer.length - reader.getCursor())
    const output = TransferableOutput.parseOutput(outputBuffer)
    return new Utxo(transactionId, utxoIndex, assetId, output)
  }
}
