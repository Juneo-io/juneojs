import { type AbstractUtxoAPI } from '../../api'
import { type TokenAsset, type AssetValue, type Blockchain } from '../../chain'
import { type Utxo, fetchUtxos } from '../../transaction'
import { getAmountValues } from '../../utils'
import { type NetworkOperation, type ChainOperationSummary } from '../operation'
import { type UtxoSpending, type Spending } from '../transaction'
import { type VMWallet, type MCNWallet } from '../wallet'
import { Balance, type BalanceListener } from './balance'

export interface ChainAccount {
  readonly chain: Blockchain
  readonly balances: Map<string, Balance>
  wallet: MCNWallet
  chainWallet: VMWallet
  addresses: string[]

  hasBalance: (asset: TokenAsset) => boolean

  getBalance: (asset: TokenAsset) => AssetValue

  getValue: (assetId: string) => bigint

  addBalanceListener: (assetId: string, listener: BalanceListener) => void

  fetchBalance: (assetId: string) => Promise<void>

  fetchAllBalances: () => Promise<void>

  estimate: (operation: NetworkOperation) => Promise<ChainOperationSummary>

  execute: (summary: ChainOperationSummary) => Promise<void>
}

export abstract class AbstractChainAccount implements ChainAccount {
  chain: Blockchain
  balances = new Map<string, Balance>()
  wallet: MCNWallet
  chainWallet: VMWallet
  addresses: string[] = []

  constructor (chain: Blockchain, wallet: MCNWallet) {
    this.chain = chain
    this.wallet = wallet
    this.chainWallet = wallet.getWallet(chain)
    this.addresses.push(this.chainWallet.getAddress())
  }

  hasBalance (asset: TokenAsset): boolean {
    return this.balances.has(asset.assetId)
  }

  /**
   * Gets the balance from this account of an asset.
   * @param asset The asset from which to get the balance.
   * @returns An AssetValue containing the value of the balance of the provided asset.
   */
  getBalance (asset: TokenAsset): AssetValue {
    return asset.getAssetValue(this.getValue(asset.assetId))
  }

  getValue (assetId: string): bigint {
    if (!this.balances.has(assetId)) {
      return BigInt(0)
    }
    return (this.balances.get(assetId) as Balance).getValue()
  }

  addBalanceListener (assetId: string, listener: BalanceListener): void {
    if (!this.balances.has(assetId)) {
      this.balances.set(assetId, new Balance())
    }
    (this.balances.get(assetId) as Balance).registerEvents(listener)
  }

  abstract fetchBalance (assetId: string): Promise<void>

  abstract fetchAllBalances (): Promise<void>

  abstract estimate (operation: NetworkOperation): Promise<ChainOperationSummary>

  abstract execute (summary: ChainOperationSummary): Promise<void>

  protected spend (spendings: Spending[]): void {
    spendings.forEach(spending => {
      if (this.balances.has(spending.assetId)) {
        (this.balances.get(spending.assetId) as Balance).spend(spending.amount)
      }
    })
  }
}

export abstract class UtxoAccount extends AbstractChainAccount {
  utxoSet: Utxo[] = []
  utxoApi: AbstractUtxoAPI
  sourceChain?: string
  protected fetching: boolean = false

  protected constructor (chain: Blockchain, utxoApi: AbstractUtxoAPI, wallet: MCNWallet, sourceChain?: string) {
    super(chain, wallet)
    this.utxoApi = utxoApi
    this.sourceChain = sourceChain
  }

  async fetchBalance (assetId: string): Promise<void> {
    // there is currently no other way to do it only with utxos
    // a seperated indexing of each asset is needed to be able to do it
    await this.fetchAllBalances()
  }

  async fetchAllBalances (): Promise<void> {
    if (this.fetching) {
      return
    }
    this.fetching = true
    this.utxoSet = await fetchUtxos(this.utxoApi, this.addresses, this.sourceChain)
    this.calculateBalances()
    this.fetching = false
  }

  abstract estimate (operation: NetworkOperation): Promise<ChainOperationSummary>

  abstract execute (summary: ChainOperationSummary): Promise<void>

  protected override spend (spendings: UtxoSpending[]): void {
    super.spend(spendings)
    const utxos: Utxo[] = []
    this.utxoSet.forEach(utxo => {
      let spent: boolean = false
      for (let i = 0; i < spendings.length; i++) {
        const spending: UtxoSpending = spendings[i]
        for (let j = 0; j < spending.utxos.length; j++) {
          const spend: Utxo = spending.utxos[j]
          const sameTransaction: boolean = spend.transactionId.transactionId === utxo.transactionId.transactionId
          const sameIndex: boolean = spend.utxoIndex === utxo.utxoIndex
          if (sameTransaction && sameIndex) {
            spent = true
            break
          }
        }
        if (spent) {
          break
        }
      }
      if (!spent) {
        utxos.push(utxo)
      }
    })
    this.utxoSet = utxos
  }

  private calculateBalances (): void {
    const values: Map<string, bigint> = getAmountValues(this.utxoSet)
    values.forEach((value, key) => {
      if (!this.balances.has(key)) {
        this.balances.set(key, new Balance())
      }
      const balance: Balance = this.balances.get(key) as Balance
      balance.update(value)
    })
    this.balances.forEach((balance, key) => {
      // force all balances that no longer have a value from calculation to 0 in order to prevent desync
      if (!values.has(key) && balance.getValue() !== BigInt(0)) {
        balance.update(BigInt(0))
      }
    })
  }
}
