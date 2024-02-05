import { type JEVMAPI } from '../../api'
import { type JEVMBlockchain } from '../../chain'
import { AccountError } from '../../utils'
import {
  BaseSpending,
  TransactionType,
  type EVMFeeData,
  estimateEVMWrapOperation,
  estimateEVMUnwrapOperation
} from '../transaction'
import {
  type ExecutableOperation,
  NetworkOperationType,
  ChainOperationSummary,
  type SendOperation,
  type WrapOperation,
  type UnwrapOperation,
  type ChainNetworkOperation
} from '../operation'
import { SendManager } from '../send'
import { type JEVMWallet, type MCNWallet } from '../wallet'
import { WrapManager } from '../wrap'
import { AbstractChainAccount, AccountType } from './account'
import { Balance } from './balance'
import { type MCNProvider } from '../../juneo'

export class EVMAccount extends AbstractChainAccount {
  override chain: JEVMBlockchain
  api: JEVMAPI
  override chainWallet: JEVMWallet
  private readonly wrapManager: WrapManager
  private readonly sendManager: SendManager

  constructor (provider: MCNProvider, chainId: string, wallet: MCNWallet) {
    super(AccountType.Nonce, provider.jevm[chainId].chain, wallet)
    this.chain = provider.jevm[chainId].chain
    this.api = provider.jevm[chainId]
    this.chainWallet = this.wallet.getJEVMWallet(this.chain)
    this.wrapManager = new WrapManager(this.api, this.chainWallet)
    this.sendManager = new SendManager(provider, wallet)
  }

  async estimate (operation: ChainNetworkOperation): Promise<ChainOperationSummary> {
    if (operation.type === NetworkOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const fee: EVMFeeData = await this.sendManager.estimateSendEVM(
        this.chain.id,
        send.assetId,
        send.amount,
        send.address
      )
      const spending: BaseSpending = new BaseSpending(this.chain, send.amount, send.assetId)
      const values = new Map<string, bigint>([[send.assetId, send.amount]])
      return new ChainOperationSummary(operation, this.chain, fee, [spending, fee.spending], values)
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
    const operation: ChainNetworkOperation = summary.operation
    if (operation.type === NetworkOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const transactionHash: string = await this.sendManager.sendEVM(
        this.chain.id,
        send.assetId,
        send.amount,
        send.address,
        summary.fee as EVMFeeData
      )
      await executable.addTrackedEVMTransaction(this.api, TransactionType.Send, transactionHash)
    } else if (operation.type === NetworkOperationType.Wrap) {
      const wrapping: WrapOperation = operation as WrapOperation
      const transactionHash: string = await this.wrapManager.wrap(
        wrapping.asset,
        wrapping.amount,
        summary.fee as EVMFeeData
      )
      await executable.addTrackedEVMTransaction(this.api, TransactionType.Wrap, transactionHash)
    } else if (operation.type === NetworkOperationType.Unwrap) {
      const wrapping: UnwrapOperation = operation as UnwrapOperation
      const transactionHash: string = await this.wrapManager.unwrap(
        wrapping.asset,
        wrapping.amount,
        summary.fee as EVMFeeData
      )
      await executable.addTrackedEVMTransaction(this.api, TransactionType.Unwrap, transactionHash)
    }
    // could be replaced with correct spend and fund but just sync all now for simplicity
    // if replaced it should take some extra cases into account e.g. sending to self
    await this.fetchBalances(summary.getAssets().values())
  }

  async fetchBalance (assetId: string): Promise<void> {
    if (!this.balances.has(assetId)) {
      this.balances.set(assetId, new Balance())
    }
    const balance: Balance = this.balances.get(assetId)!
    const address: string = this.chainWallet.getAddress()
    await balance.updateAsync(this.chain.queryEVMBalance(this.api, address, assetId))
  }
}
