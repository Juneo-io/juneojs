import { type JEVMAPI } from '../../api'
import { type JEVMBlockchain, type TokenAsset } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { AccountError } from '../../utils'
import { BaseSpending, TransactionType, type EVMFeeData, estimateEVMWrapOperation, estimateEVMUnwrapOperation } from '../transaction'
import { type ExecutableOperation, type NetworkOperation, NetworkOperationType, ChainOperationSummary, type SendOperation, type WrapOperation, type UnwrapOperation } from '../operation'
import { SendManager } from '../send'
import { type JEVMWallet, type MCNWallet } from '../wallet'
import { WrapManager } from '../wrap'
import { AbstractChainAccount } from './account'
import { Balance } from './balance'

export class EVMAccount extends AbstractChainAccount {
  override chain: JEVMBlockchain
  api: JEVMAPI
  override chainWallet: JEVMWallet
  readonly registeredAssets: string[] = []
  private readonly wrapManager: WrapManager
  private readonly sendManager: SendManager

  constructor (provider: MCNProvider, chainId: string, wallet: MCNWallet) {
    super(provider.jevm[chainId].chain, wallet)
    this.chain = provider.jevm[chainId].chain
    this.api = provider.jevm[chainId]
    this.chainWallet = this.wallet.getJEVMWallet(this.chain)
    this.wrapManager = new WrapManager(this.api, this.chainWallet.evmWallet)
    this.sendManager = new SendManager(provider, wallet)
  }

  async estimate (operation: NetworkOperation): Promise<ChainOperationSummary> {
    if (operation.type === NetworkOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const fee: EVMFeeData = await this.sendManager.estimateSendEVM(this.chain.id, send.assetId, send.amount, send.address)
      const spending: BaseSpending = new BaseSpending(this.chain, send.amount, send.assetId)
      const values = new Map<string, bigint>()
      values.set(send.assetId, send.amount)
      return new ChainOperationSummary(operation, this.chain, fee, [spending, fee.getAsSpending()], values)
    } else if (operation.type === NetworkOperationType.Wrap) {
      return await estimateEVMWrapOperation(this.api, this.chainWallet.getAddress(), operation as WrapOperation)
    } else if (operation.type === NetworkOperationType.Unwrap) {
      return await estimateEVMUnwrapOperation(this.api, this.chainWallet.getAddress(), operation as UnwrapOperation)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (summary: ChainOperationSummary): Promise<void> {
    super.spend(summary.spendings)
    const executable: ExecutableOperation = summary.getExecutable()
    const operation: NetworkOperation = summary.operation
    if (operation.type === NetworkOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const transactionHash: string = await this.sendManager.sendEVM(
        this.chain.id, send.assetId, send.amount, send.address, summary.fee as EVMFeeData
      )
      await executable.addTrackedEVMTransaction(this.api, TransactionType.Send, transactionHash)
    } else if (operation.type === NetworkOperationType.Wrap) {
      const wrapping: WrapOperation = operation as WrapOperation
      const transactionHash: string = await this.wrapManager.wrap(
        wrapping.asset, wrapping.amount, summary.fee as EVMFeeData
      )
      await executable.addTrackedEVMTransaction(this.api, TransactionType.Wrap, transactionHash)
    } else if (operation.type === NetworkOperationType.Unwrap) {
      const wrapping: UnwrapOperation = operation as UnwrapOperation
      const transactionHash: string = await this.wrapManager.unwrap(
        wrapping.asset, wrapping.amount, summary.fee as EVMFeeData
      )
      await executable.addTrackedEVMTransaction(this.api, TransactionType.Unwrap, transactionHash)
    }
    // should not be needed but in some cases this can be usefull e.g. sending to self
    await this.fetchAllBalances()
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

  async fetchBalance (assetId: string): Promise<void> {
    if (!this.balances.has(assetId)) {
      // prefer using function instead of pushing it directly to cover more cases
      this.registerAssets([assetId])
      this.balances.set(assetId, new Balance())
    }
    const balance: Balance = this.balances.get(assetId) as Balance
    const address: string = this.chainWallet.getAddress()
    await balance.updateAsync(this.chain.queryEVMBalance(this.api, address, assetId))
  }

  async fetchAllBalances (): Promise<void> {
    const fetchers: Array<Promise<void>> = []
    // guarantee gas balance
    fetchers.push(this.fetchBalance(this.chain.assetId))
    for (let j = 0; j < this.registeredAssets.length; j++) {
      fetchers.push(this.fetchBalance(this.registeredAssets[j]))
    }
    await Promise.all(fetchers)
  }
}
