import { type Blockchain } from '../chain'
import { type Utxo, Secp256k1OutputTypeId, type Secp256k1Output } from '../transaction'

export class UtxoBalance {
  chain: Blockchain
  utxoSet: Map<string, Utxo>
  balances: Map<string, bigint>

  constructor (chain: Blockchain, utxoSet: Map<string, Utxo>) {
    this.chain = chain
    this.utxoSet = utxoSet
    this.balances = new Map()
    utxoSet.forEach(utxo => {
      const assetId: string = utxo.assetId.assetId
      let amount: bigint = BigInt(0)
      if (utxo.output.typeId === Secp256k1OutputTypeId) {
        amount = (utxo.output as Secp256k1Output).amount
      }
      if (this.balances.has(assetId)) {
        amount += this.balances.get(assetId) as bigint
      }
      this.balances.set(assetId, amount)
    })
  }

  getBalance (assetId: string): bigint {
    if (!this.balances.has(assetId)) {
      return BigInt(0)
    }
    return this.balances.get(assetId) as bigint
  }
}
