import { type TransactionOutput } from './output'
import { CodecId } from './transaction'
import { AssetId, AssetIdSize, TransactionId, TransactionIdSize } from './types'
import * as encoding from '../utils/encoding'
import { JuneoBuffer, ParsingError } from '../utils'

export class Utxo {
  codecId: number = CodecId
  transactionId: TransactionId
  utxoIndex: number
  assetId: AssetId
  output: TransactionOutput

  constructor (transactionId: TransactionId, utxoIndex: number, assetId: AssetId, output: TransactionOutput) {
    this.transactionId = transactionId
    this.utxoIndex = utxoIndex
    this.assetId = assetId
    this.output = output
  }

  static parse (data: string): Utxo {
    const isHex: boolean = encoding.isHex(data)
    if (!isHex && !encoding.isBase58(data)) {
        throw new ParsingError('parsed data is not hex or cb58')
    }
    const buffer: JuneoBuffer = JuneoBuffer.fromBytes(isHex ?
        encoding.decodeCHex(data) : encoding.decodeCB58(data)
    )
    let position: number = 0
    // skip codec reading
    position += 2
    const transactionId: TransactionId = new TransactionId(
        buffer.read(position, TransactionIdSize).toCB58()
    )
    position += TransactionIdSize
    const utxoIndex: number = buffer.readUInt32(position)
    position += 4
    const assetId: AssetId = new AssetId(
        buffer.read(position, AssetIdSize).toCB58()
    )
    return new Utxo(transactionId, utxoIndex, assetId)
  }
}
