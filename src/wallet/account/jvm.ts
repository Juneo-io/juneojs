import { type MCNProvider } from '../../juneo'
import { TransactionType, type FeeData, type UtxoFeeData, type UtxoSpending, estimateJVMSendOperation } from '../transaction'
import { AccountError } from '../../utils'
import { type ExecutableMCNOperation, type MCNOperation, type MCNOperationSummary, MCNOperationType } from '../operation'
import { SendManager, type SendOperation } from '../send'
import { type JuneoWallet } from '../wallet'
import { UtxoAccount } from './account'

export class JVMAccount extends UtxoAccount {
  provider: MCNProvider
  private readonly sendManager: SendManager

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    super(provider.jvm.chain, provider.jvm, wallet)
    this.chain = provider.jvm.chain
    this.provider = provider
    this.sendManager = new SendManager(provider, wallet)
  }

  async estimate (operation: MCNOperation): Promise<MCNOperationSummary> {
    if (operation.type === MCNOperationType.Send) {
      return await estimateJVMSendOperation(this.provider, this.wallet, operation as SendOperation, this)
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (executable: ExecutableMCNOperation): Promise<void> {
    super.spend(executable.summary.spendings as UtxoSpending[])
    const operation: MCNOperation = executable.summary.operation
    if (operation.type === MCNOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionHash: string = await this.sendManager.sendJVM(send.assetId, send.amount, send.address, fees[i] as UtxoFeeData, super.utxoSet)
        const success: boolean = await executable.addTrackedJVMTransaction(this.provider.jvm, TransactionType.Send, transactionHash)
        if (!success) {
          break
        }
      }
    }
    // balances fetching is needed to get new utxos creating from this operation
    await super.fetchAllBalances()
  }
}
