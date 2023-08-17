import { type JEVMAPI, type AbstractUtxoAPI, type JVMAPI, type PlatformAPI } from '../api'
import { type TokenAsset, type AssetValue, type Blockchain, type JEVMBlockchain, type JVMBlockchain, type PlatformBlockchain, JEVM_ID } from '../chain'
import { type MCNProvider } from '../juneo'
import { type Utxo, fetchUtxos, Secp256k1OutputTypeId, type Secp256k1Output, type FeeData } from '../transaction'
import { AccountError } from '../utils'
import { type ExecutableMCNOperation, type MCNOperation, MCNOperationSummary, MCNOperationType } from './common'
import { type JEVMWallet, type VMWallet, type JuneoWallet } from './wallet'
import { type UnwrapOperation, WrapManager, type WrapOperation } from './wrap'

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
    const chain: Blockchain = account.chain
    if (operation.type === MCNOperationType.Wrap && chain.vmId === JEVM_ID) {
      return await (account as EVMAccount).estimateWrap(operation as WrapOperation)
    } else if (operation.type === MCNOperationType.Unwrap && chain.vmId === JEVM_ID) {
      return await (account as EVMAccount).estimateUnwrap(operation as UnwrapOperation)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${chainId}`)
  }

  async execute (chainId: string, executable: ExecutableMCNOperation): Promise<void> {
    if (executable.operation.type === MCNOperationType.Unsupported) {
      throw new AccountError('unsupported operation')
    }
    const account: ChainAccount = this.getAccount(chainId)
    const chain: Blockchain = account.chain
    if (executable.operation.type === MCNOperationType.Wrap && chain.vmId === JEVM_ID) {
      await (account as EVMAccount).executeWrap(executable)
    } else if (executable.operation.type === MCNOperationType.Unwrap && chain.vmId === JEVM_ID) {
      await (account as EVMAccount).executeUnwrap(executable)
    }
    throw new AccountError(`unsupported operation: ${executable.operation.type} for the chain with id: ${chainId}`)
  }

  static from (provider: MCNProvider, wallet: JuneoWallet): MCNAccount {
    const balances: ChainAccount[] = [
      new JVMAccount(provider.jvm, wallet),
      new PlatformAccount(provider.platform, wallet)
    ]
    for (const key in provider.jevm) {
      const api: JEVMAPI = provider.jevm[key]
      balances.push(new EVMAccount(api, wallet))
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
  balancesStatus: string
  balances: Map<string, bigint>

  getBalance: (asset: TokenAsset) => AssetValue

  hasBalance: (asset: TokenAsset) => boolean

  fetchBalances: () => Promise<void>
}

export abstract class AbstractAccount implements ChainAccount {
  chain: Blockchain
  balancesStatus: string = BalancesFetchingStatus.Initializing
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

  hasBalance (asset: TokenAsset): boolean {
    return this.balances.has(asset.assetId)
  }

  abstract fetchBalances (): Promise<void>
}

export class UtxoAccount extends AbstractAccount {
  utxoSet = new Map<string, Utxo>()
  utxoApi: AbstractUtxoAPI
  wallet: JuneoWallet
  chainWallet: VMWallet
  sourceChain?: string

  protected constructor (chain: Blockchain, utxoApi: AbstractUtxoAPI, wallet: JuneoWallet, sourceChain?: string) {
    super(chain)
    this.utxoApi = utxoApi
    this.wallet = wallet
    this.chainWallet = wallet.getWallet(chain)
    this.sourceChain = sourceChain
  }

  async fetchBalances (): Promise<void> {
    this.balancesStatus = BalancesFetchingStatus.Fetching
    await fetchUtxos(this.utxoSet, this.utxoApi, [this.chainWallet.getAddress()], this.sourceChain)
    this.calculateBalances()
    this.balancesStatus = BalancesFetchingStatus.Done
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

export class JVMAccount extends UtxoAccount {
  override chain: JVMBlockchain

  constructor (api: JVMAPI, wallet: JuneoWallet) {
    super(api.chain, api, wallet)
    this.chain = api.chain
  }
}

export class PlatformAccount extends UtxoAccount {
  override chain: PlatformBlockchain

  constructor (api: PlatformAPI, wallet: JuneoWallet) {
    super(api.chain, api, wallet)
    this.chain = api.chain
  }
}

export class EVMAccount extends AbstractAccount {
  override chain: JEVMBlockchain
  api: JEVMAPI
  wallet: JuneoWallet
  chainWallet: JEVMWallet
  gasBalance: bigint = BigInt(0)
  registeredAssets: string[] = []
  private readonly wrapManager: WrapManager

  constructor (api: JEVMAPI, wallet: JuneoWallet) {
    super(api.chain)
    this.chain = api.chain
    this.api = api
    this.wallet = wallet
    this.chainWallet = wallet.getEthWallet(this.chain)
    this.wrapManager = new WrapManager(this.api, this.chainWallet)
  }

  async estimateWrap (operation: WrapOperation): Promise<MCNOperationSummary> {
    const fee: FeeData = await this.wrapManager.estimateWrapFee(operation)
    return new MCNOperationSummary(operation.type, this.chain, [fee])
  }

  async estimateUnwrap (operation: UnwrapOperation): Promise<MCNOperationSummary> {
    const fee: FeeData = await this.wrapManager.estimateUnwrapFee(operation)
    return new MCNOperationSummary(operation.type, this.chain, [fee])
  }

  async executeWrap (executable: ExecutableMCNOperation): Promise<void> {
    await this.wrapManager.executeWrap(executable)
  }

  async executeUnwrap (executable: ExecutableMCNOperation): Promise<void> {
    await this.wrapManager.executeUnwrap(executable)
  }

  registerAssets (assets: TokenAsset[] | string[]): void {
    for (let i = 0; i < assets.length; i++) {
      const assetId: string = typeof assets[i] === 'string'
        ? assets[i] as string
        : (assets[i] as TokenAsset).assetId
      // no need to register chain asset id as it is already calculated as gas balance
      if (assetId === this.chain.assetId || this.registeredAssets.includes(assetId)) {
        continue
      }
      this.registeredAssets.push(assetId)
    }
  }

  async fetchBalances (): Promise<void> {
    this.balancesStatus = BalancesFetchingStatus.Fetching
    this.gasBalance = BigInt(0)
    const address: string = this.chainWallet.getHexAddress()
    this.gasBalance += await this.chain.queryEVMBalance(this.api, address, this.chain.assetId)
    for (let j = 0; j < this.registeredAssets.length; j++) {
      const assetId: string = this.registeredAssets[j]
      let amount: bigint = BigInt(0)
      if (this.balances.has(assetId)) {
        amount += this.balances.get(assetId) as bigint
      }
      amount += await this.chain.queryEVMBalance(this.api, address, assetId)
      this.balances.set(assetId, amount)
    }
    this.balances.set(this.chain.assetId, this.gasBalance)
    this.balancesStatus = BalancesFetchingStatus.Done
  }
}
