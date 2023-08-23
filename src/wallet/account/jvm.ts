import { type JVMAPI } from '../../api'
import { type JVMBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { type FeeData } from '../fee'
import { AccountError } from '../../utils'
import { TransactionType } from '../common'
import { type ExecutableMCNOperation, type MCNOperation, MCNOperationSummary, MCNOperationType } from '../operation'
import { SendManager, type SendOperation } from '../send'
import { type JuneoWallet } from '../wallet'
import { UtxoAccount } from './account'

export class JVMAccount extends UtxoAccount {
  override chain: JVMBlockchain
  api: JVMAPI
  private readonly sendManager: SendManager

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    super(provider.jvm.chain, provider.jvm, wallet)
    this.chain = provider.jvm.chain
    this.api = provider.jvm
    this.sendManager = new SendManager(provider, wallet)
  }

  async estimate (operation: MCNOperation): Promise<MCNOperationSummary> {
    if (operation.type === MCNOperationType.Send) {
      const fee: FeeData = await this.sendManager.estimateSendJVM()
      return new MCNOperationSummary(operation, this.chain, [fee])
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (executable: ExecutableMCNOperation): Promise<void> {
    const operation: MCNOperation = executable.summary.operation
    if (operation.type === MCNOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionHash: string = await this.sendManager.sendJVM(send.asset.assetId, send.amount, send.address, fees[i])
        const success: boolean = await executable.addTrackedJVMTransaction(this.api, TransactionType.Send, transactionHash).catch(error => {
          throw error
        })
        if (!success) {
          break
        }
      }
    }
  }
}
