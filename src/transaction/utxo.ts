import { type TransactionOutput } from './output'
import { type AssetId, type TransactionId } from './types'

export const CodecId: number = 0

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
}
