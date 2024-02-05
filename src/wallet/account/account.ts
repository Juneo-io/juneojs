import { type AbstractUtxoAPI } from '../../api'
import { type TokenAsset } from '../../asset'
import { type Blockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { type Utxo } from '../../transaction'
import { getUtxosAmountValues, type AssetValue, fetchUtxos, now } from '../../utils'
import { type ChainOperationSummary, type ChainNetworkOperation } from '../operation'
import { type UtxoSpending, type Spending } from '../transaction'
import { type VMWallet, type MCNWallet } from '../wallet'
import { Balance, type BalanceListener } from './balance'

export enum AccountType {
  Nonce,
  Utxo,
}

export interface ChainAccount {
  readonly type: AccountType
  readonly chain: Blockchain
  readonly balances: Map<string, Balance>
  chainWallet: VMWallet
  address: string
  signers: VMWallet[]

  /**
   * Gets the balance from this account of an asset.
   * @param asset An asset from which to get the balance.
   * @returns An AssetValue containing the value of the balance of the provided asset.
   */
  getAssetBalance: (asset: TokenAsset) => AssetValue

  /**
   * Gets the balance from this account of an asset id.
   * @param provider A provider to retrieve the asset data from.
   * @param assetId An asset id from which to get the balance.
   * @returns An AssetValue containing the value of the balance of the provided asset.
   */
  getBalance: (provider: MCNProvider, assetId: string) => Promise<AssetValue>

  getValue: (assetId: string) => bigint

  getSignersAddresses: () => string[]

  addBalanceListener: (assetId: string, listener: BalanceListener) => void

  fetchBalance: (assetId: string) => Promise<void>

  fetchBalances: (
    assets: TokenAsset[] | string[] | IterableIterator<TokenAsset> | IterableIterator<string>,
  ) => Promise<void>

  fetchAllChainBalances: () => Promise<void>

  estimate: (operation: ChainNetworkOperation) => Promise<ChainOperationSummary>

  execute: (summary: ChainOperationSummary) => Promise<void>
}

export abstract class AbstractChainAccount implements ChainAccount {
  type: AccountType
  chain: Blockchain
  balances = new Map<string, Balance>()
  chainWallet: VMWallet
  address: string
  signers: VMWallet[] = []

  constructor (type: AccountType, chain: Blockchain, wallet: MCNWallet) {
    this.type = type
    this.chain = chain
    this.chainWallet = wallet.getWallet(chain)
    this.address = this.chainWallet.getAddress()
    this.signers.push(this.chainWallet)
  }

  getAssetBalance (asset: TokenAsset): AssetValue {
    return asset.getAssetValue(this.getValue(asset.assetId))
  }

  async getBalance (provider: MCNProvider, assetId: string): Promise<AssetValue> {
    const asset: TokenAsset = await this.chain.getAsset(provider, assetId)
    return this.getAssetBalance(asset)
  }

  getValue (assetId: string): bigint {
    if (!this.balances.has(assetId)) {
      this.balances.set(assetId, new Balance())
      return BigInt(0)
    }
    return this.balances.get(assetId)!.getValue()
  }

  getSignersAddresses (): string[] {
    const addresses: string[] = []
    for (const signer of this.signers) {
      addresses.push(signer.getAddress())
    }
    return addresses
  }

  addBalanceListener (assetId: string, listener: BalanceListener): void {
    if (!this.balances.has(assetId)) {
      this.balances.set(assetId, new Balance())
    }
    this.balances.get(assetId)!.registerEvents(listener)
  }

  abstract fetchBalance (assetId: string): Promise<void>

  async fetchBalances (
    assets: TokenAsset[] | string[] | IterableIterator<TokenAsset> | IterableIterator<string>
  ): Promise<void> {
    const fetchers: Array<Promise<void>> = []
    for (const asset of assets) {
      const assetId: string = typeof asset === 'string' ? asset : asset.assetId
      fetchers.push(this.fetchBalance(assetId))
    }
    await Promise.all(fetchers)
  }

  async fetchAllChainBalances (): Promise<void> {
    await this.fetchBalances(this.chain.getRegisteredAssets())
  }

  abstract estimate (operation: ChainNetworkOperation): Promise<ChainOperationSummary>

  abstract execute (summary: ChainOperationSummary): Promise<void>

  protected spend (spendings: Spending[]): void {
    for (const spending of spendings) {
      const exists: boolean = this.balances.has(spending.assetId)
      const balance: Balance = exists ? this.balances.get(spending.assetId)! : new Balance()
      if (exists) {
        balance.spend(spending.amount)
      }
    }
  }
}

export abstract class UtxoAccount extends AbstractChainAccount {
  utxoSet: Utxo[] = []
  utxoSetMultiSig: Utxo[] = []
  utxoSetTimelocked: Utxo[] = []
  protected fetching: boolean = false
  private readonly sourceChain?: string
  private readonly utxoApi: AbstractUtxoAPI

  protected constructor (chain: Blockchain, utxoApi: AbstractUtxoAPI, wallet: MCNWallet, sourceChain?: string) {
    super(AccountType.Utxo, chain, wallet)
    this.utxoApi = utxoApi
    this.sourceChain = sourceChain
  }

  async fetchBalance (assetId: string): Promise<void> {
    // there is currently no other way to do it only with utxos
    // a seperated indexing of each asset is needed to be able to do it
    await this.refreshBalances()
  }

  override async fetchBalances (
    assets: TokenAsset[] | string[] | IterableIterator<TokenAsset> | IterableIterator<string>
  ): Promise<void> {
    // assets here are not useful because of utxos
    if (this.fetching) {
      return
    }
    this.fetching = true
    this.utxoSet = await fetchUtxos(this.utxoApi, [this.address], this.sourceChain)
    this.sortUtxoSet()
    this.calculateBalances()
    this.fetching = false
  }

  protected async refreshBalances (): Promise<void> {
    await this.fetchBalances([])
  }

  abstract estimate (operation: ChainNetworkOperation): Promise<ChainOperationSummary>

  abstract execute (summary: ChainOperationSummary): Promise<void>

  protected override spend (spendings: UtxoSpending[]): void {
    super.spend(spendings)
    const utxos: Utxo[] = []
    for (const utxo of this.utxoSet) {
      let spent: boolean = false
      for (const spending of spendings) {
        for (const spend of spending.utxos) {
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
    }
    this.utxoSet = utxos
  }

  private sortUtxoSet (): void {
    const spendableUtxoSet: Utxo[] = []
    this.utxoSetMultiSig = []
    this.utxoSetTimelocked = []
    const currentTime: bigint = now()
    for (const utxo of this.utxoSet) {
      if (utxo.output.locktime > currentTime) {
        this.utxoSetTimelocked.push(utxo)
      } else if (this.hasThreshold(utxo)) {
        this.utxoSetMultiSig.push(utxo)
      } else {
        spendableUtxoSet.push(utxo)
      }
    }
    this.utxoSet = spendableUtxoSet
  }

  private hasThreshold (utxo: Utxo): boolean {
    let value: number = 1
    // There could be duplicate addresses in signers list. User could input a mnemonic and then a private key in the vault.
    // Make sure every address is only used once when verifying the threshold.
    const usedAddresses = new Set<string>()
    for (const address of utxo.output.addresses) {
      for (const signer of this.signers) {
        if (!usedAddresses.has(signer.getAddress()) && address.matches(signer.getAddress())) {
          value += 1
          if (value >= utxo.output.threshold) {
            return true
          }
          usedAddresses.add(signer.getAddress())
          continue
        }
      }
    }
    return false
  }

  private calculateBalances (): void {
    const values: Map<string, bigint> = getUtxosAmountValues(this.utxoSet)
    for (const [key, value] of values) {
      if (!this.balances.has(key)) {
        this.balances.set(key, new Balance())
      }
      const balance: Balance = this.balances.get(key)!
      balance.update(value)
    }
    for (const [key, balance] of this.balances) {
      // force all balances that no longer have a value from calculation to 0 in order to prevent desync
      if (!values.has(key) && balance.getValue() !== BigInt(0)) {
        balance.update(BigInt(0))
      }
    }
  }
}
