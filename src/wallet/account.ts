import { type JEVMAPI, type AbstractUtxoAPI } from '../api'
import { type TokenAsset, type AssetValue, type Blockchain, type JEVMBlockchain } from '../chain'
import { type MCNProvider } from '../juneo'
import { type Utxo, fetchUtxos, Secp256k1OutputTypeId, type Secp256k1Output } from '../transaction'
import { type JuneoWallet } from './wallet'

export class MCNAccount {
  balances: ChainAccount[]

  constructor (balances: ChainAccount[]) {
    this.balances = balances
  }

  static from (provider: MCNProvider, wallet: JuneoWallet): MCNAccount {
    const balances: ChainAccount[] = [
      new UtxoAccount(provider.jvm.chain, provider.jvm, [wallet.getAddress(provider.jvm.chain)]),
      new UtxoAccount(provider.platform.chain, provider.platform, [wallet.getAddress(provider.platform.chain)])
    ]
    for (const key in provider.jevm) {
      const api: JEVMAPI = provider.jevm[key]
      const account: NonceAccount = new NonceAccount(api.chain, api, [wallet.getEthAddress(api.chain)])
      account.registerAssets(api.chain.jrc20Assets)
      balances.push(account)
    }
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
  balances: Map<string, bigint>

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

  /**
   * Gets the balance from this account of an asset.
   * @param asset The asset from which to get the balance.
   * @returns An AssetValue containing the value of the balance of the provided asset.
   */
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

export class NonceAccount extends AbstractAccount {
  override chain: JEVMBlockchain
  api: JEVMAPI
  addresses: string[]
  gasBalance: bigint = BigInt(0)
  assets: TokenAsset[] = []

  constructor (chain: JEVMBlockchain, api: JEVMAPI, addresses: string[]) {
    super(chain)
    this.chain = chain
    this.api = api
    this.addresses = addresses
  }

  registerAssets (assets: TokenAsset[]): void {
    for (let i = 0; i < assets.length; i++) {
      const asset: TokenAsset = assets[i]
      // no need to register chain asset id as it is already calculated as gas balance
      if (asset.assetId === this.chain.assetId || this.assets.includes(asset)) {
        continue
      }
    }
  }

  async fetchBalances (): Promise<void> {
    this.status = BalancesFetchingStatus.Fetching
    this.gasBalance = BigInt(0)
    for (let i = 0; i < this.addresses.length; i++) {
      const address: string = this.addresses[i]
      this.gasBalance += await this.chain.queryEVMBalance(this.api, address, this.chain.assetId)
      for (let j = 0; j < this.assets.length; j++) {
        const assetId: string = this.assets[j].assetId
        let amount: bigint = BigInt(0)
        if (this.balances.has(assetId)) {
          amount += this.balances.get(assetId) as bigint
        }
        amount += await this.chain.queryEVMBalance(this.api, address, assetId)
        this.balances.set(assetId, amount)
      }
    }
    this.balances.set(this.chain.assetId, this.gasBalance)
    this.status = BalancesFetchingStatus.Done
  }
}
