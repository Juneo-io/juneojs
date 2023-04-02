import { type Blockchain } from '../chain'
import { JuneoBuffer, type Serializable } from '../utils'
import { type AssetId, AssetIdSize, type TransactionId, TransactionIdSize } from './types'
import { type Utxo } from './utxo'

export class UserInput {
  assetId: string
  sourceChain: Blockchain
  amount: bigint
  address: string
  destinationChain: Blockchain
  locktime: bigint

  constructor (assetId: string, sourceChain: Blockchain, amount: bigint,
    address: string, destinationChain: Blockchain, locktime?: bigint) {
    this.assetId = assetId
    this.sourceChain = sourceChain
    this.amount = amount
    this.address = address
    this.destinationChain = destinationChain
    this.locktime = locktime === undefined ? BigInt(0) : locktime
  }
}

export class TransferableInput implements Serializable {
  transactionId: TransactionId
  utxoIndex: number
  assetId: AssetId
  input: TransactionInput & Serializable

  constructor (transactionId: TransactionId, utxoIndex: number, assetId: AssetId, input: TransactionInput & Serializable) {
    this.transactionId = transactionId
    this.utxoIndex = utxoIndex
    this.assetId = assetId
    this.input = input
  }

  serialize (): JuneoBuffer {
    const inputBuffer: JuneoBuffer = this.input.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      TransactionIdSize + 4 + AssetIdSize + inputBuffer.length
    )
    buffer.write(this.transactionId.serialize())
    buffer.writeUInt32(this.utxoIndex)
    buffer.write(this.assetId.serialize())
    buffer.write(inputBuffer)
    return buffer
  }

  static comparator = (a: TransferableInput, b: TransferableInput): number => {
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
  }
}

export interface TransactionInput {
  utxo: Utxo
  typeId: number
  amount: bigint
  addressIndices: number[]
}

export class Secp256k1Input implements TransactionInput, Serializable {
  utxo: Utxo
  readonly typeId: number = 0x00000005
  amount: bigint
  addressIndices: number[]

  constructor (utxo: Utxo, amount: bigint, addressIndices: number[]) {
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
    this.addressIndices.forEach(indice => {
      buffer.writeUInt32(indice)
    })
    return buffer
  }
}
