import { type AbstractUtxoAPI } from '../../api'
import { type TokenAsset, type AssetValue, type Blockchain } from '../../chain'
import { MCNProvider } from '../../juneo'
import { type Utxo, fetchUtxos, Secp256k1OutputTypeId, type Secp256k1Output } from '../../transaction'
import { AccountError } from '../../utils'
import { type ExecutableMCNOperation, type MCNOperation, type MCNOperationSummary, MCNOperationType, MCNOperationStatus } from '../operation'
import { type VMWallet, type JuneoWallet } from '../wallet'
import { EVMAccount } from './evm'
import { JVMAccount } from './jvm'
import { PlatformAccount } from './platform'

export class MCNAccount {
  private readonly chainAccounts = new Map<string, ChainAccount>()

  constructor (accounts: ChainAccount[]) {
    accounts.forEach(account => {
      this.chainAccounts.set(account.chain.id, account)
    })
  }

  getAccount (chainId: string): ChainAccount {
    if (!this.chainAccounts.has(chainId)) {
      throw new AccountError(`there is no account available for the chain with id: ${chainId}`)
    }
    return this.chainAccounts.get(chainId) as ChainAccount
  }

  async estimate (chainId: string, operation: MCNOperation): Promise<MCNOperationSummary> {
    if (operation.type === MCNOperationType.Unsupported) {
      throw new AccountError('unsupported operation')
    }
    const account: ChainAccount = this.getAccount(chainId)
    return await account.estimate(operation).catch(error => {
      throw error
    })
  }

  async execute (executable: ExecutableMCNOperation): Promise<void> {
    executable.status = MCNOperationStatus.Executing
    const account: ChainAccount = this.getAccount(executable.summary.chain.id)
    await account.execute(executable).catch(error => {
      throw error
    })
    // the only case it is not executing is if an error happened in that case we do not change it
    if (executable.status === MCNOperationStatus.Executing) {
      executable.status = MCNOperationStatus.Done
    }
  }

  static from (provider: MCNProvider, wallet: JuneoWallet): MCNAccount {
    const balances: ChainAccount[] = [
      new JVMAccount(provider, wallet),
      new PlatformAccount(provider, wallet)
    ]
    for (const chainId in provider.jevm) {
      balances.push(new EVMAccount(provider, chainId, wallet))
    }
    return new MCNAccount(balances)
  }
}

export interface ChainAccount {
  chain: Blockchain
  balances: Map<string, bigint>
  addresses: string[]

  hasBalance: (asset: TokenAsset) => boolean

  getBalance: (asset: TokenAsset) => AssetValue

  getValue: (assetId: string) => bigint

  fetchBalances: () => Promise<void>

  estimate: (operation: MCNOperation) => Promise<MCNOperationSummary>

  execute: (executable: ExecutableMCNOperation) => Promise<void>
}

export abstract class AbstractAccount implements ChainAccount {
  chain: Blockchain
  balances = new Map()
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

  async fetchBalances (): Promise<void> {
    await super.fetchBalancesAsynchronously(async () => {
      this.utxoSet = await fetchUtxos(this.utxoApi, this.addresses, this.sourceChain)
      this.calculateBalances()
    })
  }

  abstract estimate (operation: MCNOperation): Promise<MCNOperationSummary>

  abstract execute (executable: ExecutableMCNOperation): Promise<void>

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
