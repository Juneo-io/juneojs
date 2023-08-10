import { type AbstractUtxoAPI } from '../api'
import { type TokenAsset, type AssetValue, type Blockchain } from '../chain'
import { type MCNProvider } from '../juneo'
import { type Utxo, fetchUtxos, Secp256k1OutputTypeId, type Secp256k1Output } from '../transaction'
import { type JuneoWallet } from './wallet'

export class MCNAccount {
  balances: ChainAccount[]

  constructor (balances: ChainAccount[]) {
    this.balances = balances
  }

  static from (provider: MCNProvider, wallet: JuneoWallet): MCNAccount {
    const balances: ChainAccount[] = []
    const jvmBalance: UtxoAccount = new UtxoAccount(provider.jvm.chain, provider.jvm, [wallet.getAddress(provider.jvm.chain)])
    const platformBalance: UtxoAccount = new UtxoAccount(provider.platform.chain, provider.platform, [wallet.getAddress(provider.platform.chain)])
    balances.push(jvmBalance)
    balances.push(platformBalance)
    return new MCNAccount(balances)
  }
}

export enum BalancesFetchingStatus {
  Initializing = 'Initializing',
  Fetching = 'Fetching',
  Done = 'Done'
}

export interface ChainAccount {
  chain: Blockchain

  status: string

  getBalance: (asset: TokenAsset) => AssetValue

  fetchBalances: () => Promise<void>
}

export abstract class AbstractAccount implements ChainAccount {
  chain: Blockchain
  status: string = BalancesFetchingStatus.Initializing
  balances = new Map<string, bigint>()

  constructor (chain: Blockchain) {
    this.chain = chain
  }

  getBalance (asset: TokenAsset): AssetValue {
    if (!this.balances.has(asset.assetId)) {
      return asset.getAssetValue(BigInt(0))
    }
    return asset.getAssetValue(BigInt(this.balances.get(asset.assetId) as bigint))
  }

  abstract fetchBalances (): Promise<void>
}

export class UtxoAccount extends AbstractAccount {
  utxoSet = new Map<string, Utxo>()
  utxoApi: AbstractUtxoAPI
  addresses: string[]
  sourceChain?: string

  constructor (chain: Blockchain, utxoApi: AbstractUtxoAPI, addresses: string[], sourceChain?: string) {
    super(chain)
    this.utxoApi = utxoApi
    this.addresses = addresses
    this.sourceChain = sourceChain
  }

  async fetchBalances (): Promise<void> {
    this.status = BalancesFetchingStatus.Fetching
    await fetchUtxos(this.utxoSet, this.utxoApi, this.addresses, this.sourceChain)
    this.calculateBalances()
    this.status = BalancesFetchingStatus.Done
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
