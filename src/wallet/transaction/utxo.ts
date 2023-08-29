import { type Blockchain } from '../../chain'
import { type UnsignedTransaction, type Utxo } from '../../transaction'
import { FeeData } from './fee'
import { Spending } from './transaction'

export class UtxoFeeData extends FeeData {
  transaction: UnsignedTransaction

  constructor (chain: Blockchain, amount: bigint, type: string, transaction: UnsignedTransaction) {
    super(chain, amount, type)
    this.transaction = transaction
  }

  static from (fee: FeeData, transaction: UnsignedTransaction): UtxoFeeData {
    return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
  }
}

export class UtxoSpending extends Spending {
  utxos: Utxo[]

  constructor (chainId: string, amount: bigint, assetId: string, utxos: Utxo[]) {
    super(chainId, amount, assetId)
    this.utxos = utxos
  }
}
