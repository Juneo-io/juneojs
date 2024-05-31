import { type JEVMBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { AccountError } from '../../utils'
import {
  type CancelStreamOperation,
  type ChainNetworkOperation,
  ChainOperationSummary,
  type EthCallOperation,
  type ExecutableOperation,
  NetworkOperationType,
  type RedeemAuctionOperation,
  type SendOperation,
  type UnwrapOperation,
  type WithdrawStreamOperation,
  type WrapOperation
} from '../operation'
import {
  BaseSpending,
  type EVMFeeData,
  TransactionType,
  estimateEVMCancelStreamOperation,
  estimateEVMRedeemAuctionOperation,
  estimateEVMTransfer,
  estimateEVMUnwrapOperation,
  estimateEVMWithdrawStreamOperation,
  estimateEVMWrapOperation,
  estimateEthCallOperation,
  executeEVMTransaction
} from '../transaction'
import { type JEVMWallet, type MCNWallet } from '../wallet'
import { AbstractChainAccount, AccountType } from './account'
import { Balance } from './balance'

export class EVMAccount extends AbstractChainAccount {
  override chain: JEVMBlockchain
  override chainWallet: JEVMWallet
  private readonly provider: MCNProvider

  constructor (provider: MCNProvider, chainId: string, wallet: MCNWallet) {
    super(AccountType.Nonce, provider.jevmApi[chainId].chain, wallet)
    this.chain = provider.jevmApi[chainId].chain
    this.chainWallet = wallet.getJEVMWallet(this.chain)
    this.provider = provider
  }

  async estimate (operation: ChainNetworkOperation): Promise<ChainOperationSummary> {
    const provider: MCNProvider = await this.provider.getStaticProvider()
    if (operation.type === NetworkOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const fee: EVMFeeData = await estimateEVMTransfer(
        provider,
        this.chainWallet,
        this.chain.id,
        send.assetId,
        send.amount,
        send.address
      )
      const spending: BaseSpending = new BaseSpending(this.chain, send.amount, send.assetId)
      const values = new Map<string, bigint>([[send.assetId, send.amount]])
      return new ChainOperationSummary(provider, operation, this.chain, fee, [spending, fee.spending], values)
    } else if (operation.type === NetworkOperationType.Wrap) {
      return await estimateEVMWrapOperation(provider, this.chainWallet.getAddress(), operation as WrapOperation)
    } else if (operation.type === NetworkOperationType.Unwrap) {
      return await estimateEVMUnwrapOperation(provider, this.chainWallet.getAddress(), operation as UnwrapOperation)
    } else if (operation.type === NetworkOperationType.RedeemAuction) {
      return await estimateEVMRedeemAuctionOperation(
        provider,
        this.chainWallet.getAddress(),
        operation as RedeemAuctionOperation
      )
    } else if (operation.type === NetworkOperationType.WithdrawStream) {
      return await estimateEVMWithdrawStreamOperation(
        provider,
        this.chainWallet.getAddress(),
        operation as WithdrawStreamOperation
      )
    } else if (operation.type === NetworkOperationType.CancelStream) {
      return await estimateEVMCancelStreamOperation(
        provider,
        this.chainWallet.getAddress(),
        operation as CancelStreamOperation
      )
    } else if (operation.type === NetworkOperationType.EthCall) {
      return await estimateEthCallOperation(provider, this.chainWallet.getAddress(), operation as EthCallOperation)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (summary: ChainOperationSummary): Promise<void> {
    super.spend(summary.spendings)
    const operation: NetworkOperationType = summary.operation.type
    if (operation === NetworkOperationType.Send) {
      await this.executeAndTrackTransaction(summary, TransactionType.Send)
    } else if (operation === NetworkOperationType.Wrap) {
      await this.executeAndTrackTransaction(summary, TransactionType.Wrap)
    } else if (operation === NetworkOperationType.Unwrap) {
      await this.executeAndTrackTransaction(summary, TransactionType.Unwrap)
    } else if (operation === NetworkOperationType.RedeemAuction) {
      await this.executeAndTrackTransaction(summary, TransactionType.RedeemAuction)
    } else if (operation === NetworkOperationType.WithdrawStream) {
      await this.executeAndTrackTransaction(summary, TransactionType.WithdrawStream)
    } else if (operation === NetworkOperationType.CancelStream) {
      await this.executeAndTrackTransaction(summary, TransactionType.CancelStream)
    } else if (operation === NetworkOperationType.EthCall) {
      await this.executeAndTrackTransaction(summary, TransactionType.EthCall)
    }
    // could be replaced with correct spend and fund but just sync all now for simplicity
    // if replaced it should take some extra cases into account e.g. sending to self
    await this.fetchBalances(summary.getAssets().values())
  }

  private async executeAndTrackTransaction (summary: ChainOperationSummary, type: TransactionType): Promise<void> {
    const executable: ExecutableOperation = summary.getExecutable()
    const transactionHash: string = await executeEVMTransaction(
      executable.provider,
      this.chainWallet,
      summary.fee as EVMFeeData
    )
    await executable.trackEVMTransaction(this.chain.id, transactionHash, type)
  }

  async fetchBalance (assetId: string): Promise<void> {
    if (!this.balances.has(assetId)) {
      this.balances.set(assetId, new Balance())
    }
    const balance: Balance = this.balances.get(assetId)!
    const address: string = this.chainWallet.getAddress()
    await balance.updateAsync(this.chain.queryBalance(this.provider.jevmApi[this.chain.id], address, assetId))
  }
}
