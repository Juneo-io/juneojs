import { type AbstractUtxoAPI } from '../../api'
import { type TokenAsset } from '../../asset'
import { type Blockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { type Utxo } from '../../transaction'
import { type AssetValue, calculateBalances, fetchUtxos, TimeUtils } from '../../utils'
import { type ChainNetworkOperation, type ChainOperationSummary } from '../operation'
import { type Spending, type UtxoSpending } from '../transaction'
import { type MCNWallet, type VMWallet } from '../wallet'
import { Balance } from './balance'

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
   * Gets the AssetValue from this account of an asset.
   * @param asset An asset from which to get the balance.
   * @returns An AssetValue containing the value of the balance of the provided asset.
   */
  getAssetValue: (asset: TokenAsset) => AssetValue

  /**
   * Gets the AssetValue from this account of an asset id.
   * @param provider A provider to retrieve the asset data from.
   * @param assetId An asset id from which to get the balance.
   * @returns An AssetValue containing the value of the balance of the provided asset.
   */
  getValue: (provider: MCNProvider, assetId: string) => Promise<AssetValue>

  getAmount: (assetId: string) => bigint

  getBalance: (assetId: string) => Balance

  getSignersAddresses: () => string[]

  fetchBalance: (assetId: string) => Promise<void>

  fetchBalances: (
    assets: TokenAsset[] | string[] | IterableIterator<TokenAsset> | IterableIterator<string>,
  ) => Promise<void>
}

export abstract class AbstractChainAccount implements ChainAccount {
  type: AccountType
  chain: Blockchain
  balances = new Map<string, Balance>()
  chainWallet: VMWallet
  address: string
  signers: VMWallet[]

  constructor (type: AccountType, chain: Blockchain, wallet: MCNWallet) {
    this.type = type
    this.chain = chain
    this.chainWallet = wallet.getWallet(chain)
    this.address = this.chainWallet.getAddress()
    this.signers = [this.chainWallet]
  }

  getAssetValue (asset: TokenAsset): AssetValue {
    return asset.getAssetValue(this.getAmount(asset.assetId))
  }

  async getValue (provider: MCNProvider, assetId: string): Promise<AssetValue> {
    const asset: TokenAsset = await this.chain.getAsset(provider, assetId)
    return this.getAssetValue(asset)
  }

  getAmount (assetId: string): bigint {
    return this.getBalance(assetId).getValue()
  }

  getBalance (assetId: string): Balance {
    if (!this.balances.has(assetId)) {
      this.balances.set(assetId, new Balance())
    }
    return this.balances.get(assetId)!
  }

  getSignersAddresses (): string[] {
    const addresses: string[] = []
    for (const signer of this.signers) {
      addresses.push(signer.getAddress())
    }
    return addresses
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

  abstract estimate (operation: ChainNetworkOperation): Promise<ChainOperationSummary>

  abstract execute (summary: ChainOperationSummary): Promise<void>

  protected spend (spendings: Spending[]): void {
    for (const spending of spendings) {
      this.getBalance(spending.assetId).spend(spending.amount)
    }
  }
}

export abstract class UtxoAccount extends AbstractChainAccount {
  utxoSet: Utxo[] = []
  utxoSetMultiSig: Utxo[] = []
  utxoSetLocked: Utxo[] = []
  readonly lockedBalances: Map<string, Balance> = new Map<string, Balance>()
  protected fetching: boolean = false
  private readonly utxoApi: AbstractUtxoAPI

  protected constructor (chain: Blockchain, utxoApi: AbstractUtxoAPI, wallet: MCNWallet) {
    super(AccountType.Utxo, chain, wallet)
    this.utxoApi = utxoApi
  }

  getLockedAssetValue (asset: TokenAsset): AssetValue {
    return asset.getAssetValue(this.getLockedAmount(asset.assetId))
  }

  async getLockedValue (provider: MCNProvider, assetId: string): Promise<AssetValue> {
    const asset: TokenAsset = await this.chain.getAsset(provider, assetId)
    return this.getLockedAssetValue(asset)
  }

  getLockedAmount (assetId: string): bigint {
    return this.getLockedBalance(assetId).getValue()
  }

  getLockedBalance (assetId: string): Balance {
    if (!this.lockedBalances.has(assetId)) {
      this.lockedBalances.set(assetId, new Balance())
    }
    return this.lockedBalances.get(assetId)!
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
    this.utxoSet = await fetchUtxos(this.utxoApi, [this.address])
    this.sortUtxoSet()
    calculateBalances(this.utxoSet, this.balances)
    calculateBalances(this.utxoSetLocked, this.lockedBalances)
    this.fetching = false
  }

  async refreshBalances (): Promise<void> {
    await this.fetchBalances([])
  }

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
    this.utxoSetLocked = []
    const currentTime: bigint = TimeUtils.now()
    for (const utxo of this.utxoSet) {
      if (utxo.output.locktime > currentTime) {
        this.utxoSetLocked.push(utxo)
      } else if (!this.hasThreshold(utxo)) {
        this.utxoSetMultiSig.push(utxo)
      } else {
        spendableUtxoSet.push(utxo)
      }
    }
    this.utxoSet = spendableUtxoSet
  }

  private hasThreshold (utxo: Utxo): boolean {
    let value: number = 0
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
}
