import { JuneoBuffer, type Serializable } from '../../utils'
import { Secp256k1InitialStateFxId } from '../constants'
import { type TransactionOutput } from '../output'
import { type AssetId, type TransactionId } from '../types'

export class TransferableOp implements Serializable {
  assetId: AssetId
  utxoIds: Array<[TransactionId, number]>
  op: TransferOp

  constructor (assetId: AssetId, utxoIds: Array<[TransactionId, number]>, op: TransferOp) {
    this.assetId = assetId
    this.utxoIds = utxoIds
    this.op = op
  }

  serialize (): JuneoBuffer {
    throw new Error('not implemented')
  }

  static comparator = (a: TransferableOp, b: TransferableOp): number => {
    return JuneoBuffer.comparator(a.serialize(), b.serialize())
  }
}

export interface TransferOp extends Serializable {
  typeId: number
  addressIndices: number[]
}

export interface InitialState extends Serializable {
  fxId: number
  outputs: TransactionOutput[]
}

export class Secp256k1InitialState implements InitialState {
  fxId: number = Secp256k1InitialStateFxId
  outputs: TransactionOutput[]

  constructor (outputs: TransactionOutput[]) {
    this.outputs = outputs
  }

  serialize (): JuneoBuffer {
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize = 0
    for (const output of this.outputs) {
      const bytes: JuneoBuffer = output.serialize()
      outputsSize += bytes.length
      outputsBytes.push(bytes)
    }
    const buffer = JuneoBuffer.alloc(4 + 4 + outputsSize)
    buffer.writeUInt32(this.fxId)
    buffer.writeUInt32(this.outputs.length)
    for (const bytes of outputsBytes) {
      buffer.write(bytes)
    }
    return buffer
  }
}
