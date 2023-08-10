import { type AbstractUtxoAPI } from '../api'
import { type TokenAsset, type AssetValue } from '../chain'
import { type Utxo, Secp256k1OutputTypeId, type Secp256k1Output, fetchUtxos } from '../transaction'
import { type AccountBalance } from './account'

export enum BalanceFetchingStatus {
  Initializing = 'Initializing',
  Fetching = 'Fetching',
  Done = 'Done'
}

export abstract class AbstractBalance implements AccountBalance {
  balances = new Map<string, bigint>()

  getBalance (asset: TokenAsset): AssetValue {
    if (!this.balances.has(asset.assetId)) {
      return asset.getAssetValue(BigInt(0))
    }
    return asset.getAssetValue(BigInt(this.balances.get(asset.assetId) as bigint))
  }

  abstract fetchBalances (): Promise<void>
}

export class UtxoBalance extends AbstractBalance {
  status: string = BalanceFetchingStatus.Initializing
  utxoSet = new Map<string, Utxo>()
  utxoApi: AbstractUtxoAPI
  addresses: string[]
  sourceChain?: string

  constructor (utxoApi: AbstractUtxoAPI, addresses: string[], sourceChain?: string) {
    super()
    this.utxoApi = utxoApi
    this.addresses = addresses
    this.sourceChain = sourceChain
  }

  async fetchBalances (): Promise<void> {
    this.status = BalanceFetchingStatus.Fetching
    await fetchUtxos(this.utxoSet, this.utxoApi, this.addresses, this.sourceChain)
    this.calculateBalances()
    this.status = BalanceFetchingStatus.Done
  }

  private calculateBalances (): void {
    this.utxoSet.forEach(utxo => {
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
}
