import { type Blockchain } from '../../chain'
import { type Utxo, type UnsignedTransaction } from '../../transaction'
import { FeeData } from './fee'
import { Spending } from './transaction'

export class UtxoFeeData extends FeeData {
  transaction: UnsignedTransaction

  constructor (chain: Blockchain, amount: bigint, type: string, transaction: UnsignedTransaction) {
    super(chain, amount, type)
    this.transaction = transaction
  }
}

export class UtxoSpending extends Spending {
  utxos: Utxo[]

  constructor (chainId: string, amount: bigint, assetId: string, utxos: Utxo[]) {
    super(chainId, amount, assetId)
    this.utxos = utxos
  }
}
