import { type Blockchain } from '../chain'
import { InputError, JuneoBuffer, ParsingError, type Serializable, SignatureError } from '../utils'
import { AssetIdSize, Secp256k1InputTypeId, TransactionIdSize } from './constants'
import { type Utxo } from './output'
import { AbstractSignable } from './signature'
import { type Address, AssetId, TransactionId } from './types'

export class UserInput {
  assetId: string
  sourceChain: Blockchain
  amount: bigint
  addresses: string[]
  threshold: number
  destinationChain: Blockchain
  locktime: bigint

  constructor (
    assetId: string,
    sourceChain: Blockchain,
    amount: bigint,
    addresses: string[],
    threshold: number,
    destinationChain: Blockchain,
    locktime: bigint = BigInt(0)
  ) {
    this.assetId = assetId
    this.sourceChain = sourceChain
    if (amount <= BigInt(0)) {
      throw new InputError('user input amount must be greater than 0')
    }
    this.amount = amount
    this.addresses = addresses
    this.threshold = threshold
    this.destinationChain = destinationChain
    this.locktime = locktime
  }
}

export interface Spendable {
  getAmount: () => bigint
  getAssetId: () => AssetId
}

export class TransferableInput extends AbstractSignable implements Serializable, Spendable {
  transactionId: TransactionId
  utxoIndex: number
  assetId: AssetId
  input: TransactionInput

  constructor (transactionId: TransactionId, utxoIndex: number, assetId: AssetId, input: TransactionInput) {
    super()
    this.transactionId = transactionId
    this.utxoIndex = utxoIndex
    this.assetId = assetId
    this.input = input
  }

  getAmount (): bigint {
    if (this.input.typeId === Secp256k1InputTypeId) {
      return (this.input as Secp256k1Input).amount
    }
    return BigInt(0)
  }

  getAssetId (): AssetId {
    return this.assetId
  }

  getAddresses (): Address[] {
    if (this.input.utxo === undefined) {
      throw new SignatureError('cannot get addresses of read only inputs')
    }
    const addresses: Address[] = []
    const indices = this.input.addressIndices
    for (let i = 0; i < indices.length; i++) {
      addresses.push(this.input.utxo.output.addresses[indices[i]])
    }
    return addresses
  }

  getThreshold (): number {
    if (this.input.utxo === undefined) {
      throw new SignatureError('cannot get threshold of read only inputs')
    }
    return this.input.utxo.output.threshold
  }

  serialize (): JuneoBuffer {
    const inputBuffer = this.input.serialize()
    const buffer = JuneoBuffer.alloc(TransactionIdSize + 4 + AssetIdSize + inputBuffer.length)
    buffer.write(this.transactionId)
    buffer.writeUInt32(this.utxoIndex)
    buffer.write(this.assetId)
    buffer.write(inputBuffer)
    return buffer
  }

  static comparator = (a: TransferableInput, b: TransferableInput): number => {
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
  }

  static parse (data: string | JuneoBuffer): TransferableInput {
    const reader = JuneoBuffer.from(data).createReader()
    const transactionId = new TransactionId(reader.read(TransactionIdSize).toCB58())
    const utxoIndex = reader.readUInt32()
    const assetId = new AssetId(reader.read(AssetIdSize).toCB58())
    return new TransferableInput(transactionId, utxoIndex, assetId, this.parseInput(reader.readRemaining()))
  }

  static parseInput (data: string | JuneoBuffer): TransactionInput {
    const reader = JuneoBuffer.from(data).createReader()
    const typeId = reader.readUInt32()
    switch (typeId) {
      case Secp256k1InputTypeId: {
        return Secp256k1Input.parse(data)
      }
      default: {
        throw new ParsingError(`unsupported input type id "${typeId}"`)
      }
    }
  }
}

export interface TransactionInput extends Serializable {
  utxo: Utxo | undefined
  typeId: number
  amount: bigint
  addressIndices: number[]
}

export class Secp256k1Input implements TransactionInput {
  utxo: Utxo | undefined
  readonly typeId = Secp256k1InputTypeId
  amount: bigint
  addressIndices: number[]

  constructor (amount: bigint, addressIndices: number[], utxo?: Utxo) {
    this.utxo = utxo
    this.amount = amount
    this.addressIndices = addressIndices
    this.addressIndices.sort((a: number, b: number) => {
      return a - b
    })
  }

  serialize (): JuneoBuffer {
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 4 + 8 + 4 = 16
      16 + 4 * this.addressIndices.length
    )
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt64(this.amount)
    buffer.writeUInt32(this.addressIndices.length)
    for (const indice of this.addressIndices) {
      buffer.writeUInt32(indice)
    }
    return buffer
  }

  static parse (data: string | JuneoBuffer): Secp256k1Input {
    const reader = JuneoBuffer.from(data).createReader()
    reader.readAndVerifyTypeId(Secp256k1InputTypeId)
    const amount = reader.readUInt64()
    const addressIndicesCount = reader.readUInt32()
    const indices: number[] = []
    for (let i = 0; i < addressIndicesCount; i++) {
      const indice = reader.readUInt32()
      indices.push(indice)
    }
    return new Secp256k1Input(amount, indices)
  }
}
