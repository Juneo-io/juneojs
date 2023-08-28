import { type AbstractUtxoAPI } from '../../api'
import { type TokenAsset, type AssetValue, type Blockchain } from '../../chain'
import { type Utxo, fetchUtxos, Secp256k1OutputTypeId, type Secp256k1Output, type UnsignedTransaction } from '../../transaction'
import { type ExecutableMCNOperation, type MCNOperation, type MCNOperationSummary } from '../operation'
import { type UtxoSpending, type Spending } from '../transaction'
import { type VMWallet, type JuneoWallet } from '../wallet'

export interface ChainAccount {
  chain: Blockchain
  balances: Map<string, bigint>
  addresses: string[]

  hasBalance: (asset: TokenAsset) => boolean

  getBalance: (asset: TokenAsset) => AssetValue

  getValue: (assetId: string) => bigint

  fetchBalance: (assetId: string) => Promise<void>

  fetchBalances: () => Promise<void>

  estimate: (operation: MCNOperation) => Promise<MCNOperationSummary>

  execute: (executable: ExecutableMCNOperation) => Promise<void>
}

export abstract class AbstractAccount implements ChainAccount {
  chain: Blockchain
  balances = new Map<string, bigint>()
  protected fetching: boolean = false
  addresses: string[] = []

  constructor (chain: Blockchain) {
    this.chain = chain
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
    return BigInt(this.balances.get(assetId) as bigint)
  }

  abstract fetchBalance (assetId: string): Promise<void>

  abstract fetchBalances (): Promise<void>

  protected async fetchBalancesAsynchronously (fetch: () => Promise<void>): Promise<void> {
    if (this.fetching) {
      return
    }
    this.fetching = true
    this.balances.clear()
    await fetch()
    this.fetching = false
  }

  abstract estimate (operation: MCNOperation): Promise<MCNOperationSummary>

  abstract execute (executable: ExecutableMCNOperation): Promise<void>

  protected spend (spendings: Spending[]): void {
    spendings.forEach(spending => {
      let amount: bigint = BigInt(0)
      if (this.balances.has(spending.assetId)) {
        amount += this.balances.get(spending.assetId) as bigint
      }
      this.balances.set(spending.assetId, amount - spending.amount)
    })
  }
}

export abstract class UtxoAccount extends AbstractAccount {
  utxoSet: Utxo[] = []
  utxoApi: AbstractUtxoAPI
  wallet: JuneoWallet
  chainWallet: VMWallet
  sourceChain?: string

  protected constructor (chain: Blockchain, utxoApi: AbstractUtxoAPI, wallet: JuneoWallet, sourceChain?: string) {
    super(chain)
    this.utxoApi = utxoApi
    this.wallet = wallet
    this.chainWallet = wallet.getWallet(chain)
    this.addresses.push(this.chainWallet.getAddress())
    this.sourceChain = sourceChain
  }

  async fetchBalance (assetId: string): Promise<void> {
    // there is currently no other way to do it only with utxos
    // a seperated indexing of each asset is needed to be able to do it
    await this.fetchBalances()
  }

  async fetchBalances (): Promise<void> {
    await super.fetchBalancesAsynchronously(async () => {
      this.utxoSet = await fetchUtxos(this.utxoApi, this.addresses, this.sourceChain)
      this.calculateBalances()
    })
  }

  abstract estimate (operation: MCNOperation): Promise<MCNOperationSummary>

  abstract execute (executable: ExecutableMCNOperation): Promise<void>

  protected override spend (spendings: UtxoSpending[]): void {
    super.spend(spendings)
    const utxoSet: Utxo[] = []
    spendings.forEach(spending => {
      spending.utxos.forEach(spend => {
        this.utxoSet.forEach(utxo => {
          if (spend.transactionId !== utxo.transactionId && spend.utxoIndex !== utxo.utxoIndex) {
            utxoSet.push(utxo)
          }
        })
      })
    })
    this.utxoSet = utxoSet
  }

  getTransactionUtxos (transaction: UnsignedTransaction): Utxo[] {
    const utxos: Utxo[] = []
    transaction.inputs.forEach(transferable => {
      // should be Utxo here because transaction should be from builder
      // undefined should only be the case if it is an input from parsing bytes
      utxos.push(transferable.input.utxo as Utxo)
    })
    return utxos
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
