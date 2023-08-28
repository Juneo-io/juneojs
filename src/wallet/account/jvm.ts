import { type InfoAPI, type JVMAPI } from '../../api'
import { type JVMBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { TransactionType, FeeData, type UtxoFeeData, UtxoSpending, FeeType, Spending } from '../transaction'
import { AccountError } from '../../utils'
import { type ExecutableMCNOperation, type MCNOperation, MCNOperationSummary, MCNOperationType } from '../operation'
import { SendManager, type SendOperation } from '../send'
import { type JuneoWallet } from '../wallet'
import { UtxoAccount } from './account'

export class JVMAccount extends UtxoAccount {
  override chain: JVMBlockchain
  api: JVMAPI
  private readonly info: InfoAPI
  private readonly sendManager: SendManager

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    super(provider.jvm.chain, provider.jvm, wallet)
    this.chain = provider.jvm.chain
    this.api = provider.jvm
    this.info = provider.info
    this.sendManager = new SendManager(provider, wallet)
  }

  async estimate (operation: MCNOperation): Promise<MCNOperationSummary> {
    if (operation.type === MCNOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      return await this.sendManager.estimateSendJVM(send.assetId, send.amount, send.address, super.utxoSet).then(fee => {
        return new MCNOperationSummary(operation, this.chain, [fee], [new UtxoSpending(this.chain.id, send.amount, send.assetId, super.getUtxos(fee.transaction)), fee])
      }, async () => {
        const fee: FeeData = new FeeData(this.chain, BigInt((await this.info.getTxFee()).txFee), FeeType.BaseFee)
        return new MCNOperationSummary(operation, this.chain, [fee], [new Spending(this.chain.id, send.amount, send.assetId), fee])
      })
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
        const success: boolean = await executable.addTrackedJVMTransaction(this.api, TransactionType.Send, transactionHash)
        if (!success) {
          break
        }
      }
    }
    // balances fetching is needed to get new utxos creating from this operation
    await super.fetchBalances()
  }
}
