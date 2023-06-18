import { type Blockchain } from '../chain'
import { JuneoBuffer, ParsingError, sha256, type Serializable, SignatureError } from '../utils'
import { type VMWallet } from '../wallet'
import { type Signable } from './signature'
import { type Address, AssetId, AssetIdSize, Signature, TransactionId, TransactionIdSize } from './types'
import { type Utxo } from './utxo'

const Secp256k1InputTypeId: number = 0x00000005

export class UserInput {
  assetId: string
  sourceChain: Blockchain
  amount: bigint
  address: string
  destinationChain: Blockchain
  locktime: bigint

  constructor (assetId: string, sourceChain: Blockchain, amount: bigint,
    address: string, destinationChain: Blockchain, locktime: bigint = BigInt(0)) {
    this.assetId = assetId
    this.sourceChain = sourceChain
    this.amount = amount
    this.address = address
    this.destinationChain = destinationChain
    this.locktime = locktime
  }
}

export interface Spendable {
  getAmount: () => bigint
  getAssetId: () => AssetId
}

export class TransferableInput implements Serializable, Signable, Spendable {
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

  getAmount (): bigint {
    if (this.input.typeId === Secp256k1InputTypeId) {
      return (this.input as Secp256k1Input).amount
    }
    return BigInt(0)
  }

  getAssetId (): AssetId {
    return this.assetId
  }

  sign (bytes: JuneoBuffer, wallets: VMWallet[]): Signature[] {
    if (this.input.utxo === undefined) {
      throw new SignatureError('cannot sign read only inputs')
    }
    const indices: number[] = this.input.addressIndices
    const signatures: Signature[] = []
    const threshold: number = this.input.utxo.output.threshold
    for (let i = 0; i < threshold && i < indices.length; i++) {
      const address: Address = this.input.utxo.output.addresses[i]
      for (let j = 0; j < wallets.length; j++) {
        const wallet: VMWallet = wallets[j]
        if (address.matches(wallet.getAddress())) {
          signatures.push(new Signature(wallet.sign(sha256(bytes))))
          break
        }
      }
    }
    if (signatures.length < threshold) {
      throw new SignatureError('missing wallets to complete signatures')
    }
    return signatures
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

  static parse (data: string | JuneoBuffer): TransferableInput {
    const buffer: JuneoBuffer = typeof data === 'string'
      ? JuneoBuffer.fromString(data)
      : data
    // start at 2 to skip codec if from string from api
    let position: number = typeof data === 'string' ? 2 : 0
    const transactionId: TransactionId = new TransactionId(buffer.read(position, TransactionIdSize).toCB58())
    position += TransactionIdSize
    const utxoIndex: number = buffer.readUInt32(position)
    position += 4
    const assetId: AssetId = new AssetId(buffer.read(position, AssetIdSize).toCB58())
    position += AssetIdSize
    return new TransferableInput(
      transactionId,
      utxoIndex,
      assetId,
      this.parseInput(buffer.read(position, buffer.length - position))
    )
  }

  static parseInput (data: string | JuneoBuffer): TransactionInput & Serializable {
    const buffer: JuneoBuffer = typeof data === 'string'
      ? JuneoBuffer.fromString(data)
      : data
    const typeId: number = buffer.readUInt32(0)
    if (typeId === Secp256k1InputTypeId) {
      return Secp256k1Input.parse(data)
    } else {
      throw new ParsingError(`unsupported output type id "${typeId}"`)
    }
  }
}

export interface TransactionInput {
  utxo: Utxo | undefined
  typeId: number
  amount: bigint
  addressIndices: number[]
}

export class Secp256k1Input implements TransactionInput, Serializable {
  utxo: Utxo | undefined
  readonly typeId: number = Secp256k1InputTypeId
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
    this.addressIndices.forEach(indice => {
      buffer.writeUInt32(indice)
    })
    return buffer
  }

  static parse (data: string | JuneoBuffer): Secp256k1Input {
    const buffer: JuneoBuffer = typeof data === 'string'
      ? JuneoBuffer.fromString(data)
      : data
    // start at 4 to skip type id reading
    let position: number = 4
    const amount: bigint = buffer.readUInt64(position)
    position += 8
    const addressIndicesCount: number = buffer.readUInt32(position)
    position += 4
    const indices: number[] = []
    for (let i = 0; i < addressIndicesCount; i++) {
      const indice: number = buffer.readUInt32(position)
      position += 4
      indices.push(indice)
    }
    return new Secp256k1Input(amount, indices)
  }
}
