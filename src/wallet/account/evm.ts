import { ethers } from 'ethers'
import { type JEVMBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { AccountError, isContractAddress } from '../../utils'
import {
  type ChainNetworkOperation,
  type ChainOperationSummary,
  type EthCallOperation,
  type ExecutableOperation,
  NetworkOperationType,
  type SendOperation,
  type UnwrapOperation,
  type WrapOperation
} from '../operation'
import {
  BaseSpending,
  type EVMFeeData,
  FeeType,
  TransactionType,
  estimateEVMOperation,
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
      const isContract: boolean = isContractAddress(send.assetId)
      const address: string = isContract ? send.assetId : send.address
      const data: string = isContract
        ? await this.chain.getContractTransactionData(provider, send.assetId, address, send.amount)
        : '0x'
      return await estimateEVMOperation(
        provider,
        this.chain,
        this.chainWallet.getAddress(),
        send,
        [new BaseSpending(this.chain, send.amount, send.assetId)],
        new Map<string, bigint>([[send.assetId, send.amount]]),
        address,
        isContract ? BigInt(0) : send.amount,
        data,
        FeeType.BaseFee
      )
    } else if (operation.type === NetworkOperationType.Wrap) {
      const wrap = operation as WrapOperation
      return await estimateEVMOperation(
        provider,
        this.chain,
        this.chainWallet.getAddress(),
        wrap,
        [new BaseSpending(this.chain, wrap.amount, this.chain.assetId)],
        new Map<string, bigint>([[this.chain.assetId, wrap.amount]]),
        wrap.asset.address,
        wrap.amount,
        wrap.asset.adapter.getDepositData(),
        FeeType.Wrap
      )
    } else if (operation.type === NetworkOperationType.Unwrap) {
      const unwrap = operation as UnwrapOperation
      return await estimateEVMOperation(
        provider,
        this.chain,
        this.chainWallet.getAddress(),
        unwrap,
        [new BaseSpending(this.chain, unwrap.amount, unwrap.asset.assetId)],
        new Map<string, bigint>([[unwrap.asset.assetId, unwrap.amount]]),
        unwrap.asset.address,
        BigInt(0),
        unwrap.asset.adapter.getWithdrawData(unwrap.amount),
        FeeType.Unwrap
      )
    } else if (operation.type === NetworkOperationType.EthCall) {
      const ethCall = operation as EthCallOperation
      const contract = new ethers.Contract(ethCall.contract, ethCall.abi, this.chain.ethProvider)
      const data = contract.interface.encodeFunctionData(ethCall.functionName, ethCall.values)
      const values = new Map<string, bigint>()
      if (ethCall.amount > 0) {
        values.set(this.chain.assetId, ethCall.amount)
      }
      return await estimateEVMOperation(
        provider,
        this.chain,
        this.chainWallet.getAddress(),
        ethCall,
        [],
        values,
        ethCall.contract,
        ethCall.amount,
        data,
        FeeType.EthCall
      )
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
