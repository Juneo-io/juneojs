import { type JEVMAPI } from '../../api'
import { type JEVMBlockchain, type TokenAsset } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { AccountError } from '../../utils'
import { BaseSpending, TransactionType, type FeeData, type EVMFeeData, estimateEVMWrapOperation, estimateEVMUnwrapOperation } from '../transaction'
import { type ExecutableMCNOperation, type MCNOperation, MCNOperationSummary, MCNOperationType } from '../operation'
import { SendManager, type SendOperation } from '../send'
import { type JEVMWallet, type JuneoWallet } from '../wallet'
import { type UnwrapOperation, WrapManager, type WrapOperation } from '../wrap'
import { AbstractChainAccount } from './account'
import { Balance } from './balance'

export class EVMAccount extends AbstractChainAccount {
  override chain: JEVMBlockchain
  api: JEVMAPI
  override chainWallet: JEVMWallet
  readonly registeredAssets: string[] = []
  private readonly wrapManager: WrapManager
  private readonly sendManager: SendManager

  constructor (provider: MCNProvider, chainId: string, wallet: JuneoWallet) {
    super(provider.jevm[chainId].chain, wallet)
    this.chain = provider.jevm[chainId].chain
    this.api = provider.jevm[chainId]
    this.chainWallet = wallet.getEthWallet(this.chain)
    this.addresses.push(this.chainWallet.getHexAddress())
    this.wrapManager = new WrapManager(this.api, this.chainWallet)
    this.sendManager = new SendManager(provider, wallet)
  }

  async estimate (operation: MCNOperation): Promise<MCNOperationSummary> {
    if (operation.type === MCNOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const fee: EVMFeeData = await this.sendManager.estimateSendEVM(this.chain.id, send.assetId, send.amount, send.address)
      return new MCNOperationSummary(operation, this.chain, [fee], [new BaseSpending(this.chain.id, send.amount, send.assetId), fee])
    } else if (operation.type === MCNOperationType.Wrap) {
      return await estimateEVMWrapOperation(this.api, this.chainWallet.getHexAddress(), operation as WrapOperation)
    } else if (operation.type === MCNOperationType.Unwrap) {
      return await estimateEVMUnwrapOperation(this.api, this.chainWallet.getHexAddress(), operation as UnwrapOperation)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (executable: ExecutableMCNOperation): Promise<void> {
    super.spend(executable.summary.spendings)
    const operation: MCNOperation = executable.summary.operation
    if (operation.type === MCNOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionHash: string = await this.sendManager.sendEVM(this.chain.id, send.assetId, send.amount, send.address, fees[i] as EVMFeeData)
        const success: boolean = await executable.addTrackedEVMTransaction(this.api, TransactionType.Send, transactionHash)
        if (!success) {
          break
        }
      }
    } else if (operation.type === MCNOperationType.Wrap) {
      const wrapping: WrapOperation = operation as WrapOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionHash: string = await this.wrapManager.wrap(wrapping.asset, wrapping.amount, fees[i] as EVMFeeData)
        const success: boolean = await executable.addTrackedEVMTransaction(this.api, TransactionType.Wrap, transactionHash)
        if (!success) {
          break
        }
      }
    } else if (operation.type === MCNOperationType.Unwrap) {
      const wrapping: UnwrapOperation = operation as UnwrapOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionHash: string = await this.wrapManager.unwrap(wrapping.asset, wrapping.amount, fees[i] as EVMFeeData)
        const success: boolean = await executable.addTrackedEVMTransaction(this.api, TransactionType.Unwrap, transactionHash)
        if (!success) {
          break
        }
      }
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
    const address: string = this.chainWallet.getHexAddress()
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
