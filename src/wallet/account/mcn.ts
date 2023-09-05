import { AccountError } from '../../utils'
import { type JuneoWallet } from '../wallet'
import { MCNOperationType, MCNOperationStatus, type MCNOperation, type MCNOperationSummary, type ExecutableMCNOperation } from '../operation'
import { type ChainAccount } from './account'
import { EVMAccount } from './evm'
import { JVMAccount } from './jvm'
import { PlatformAccount } from './platform'
import { type Spending, BaseSpending } from '../transaction'
import { CrossManager, type CrossOperation } from '../cross'
import { type MCNProvider } from '../../juneo'

export class MCNAccount {
  private readonly chainAccounts = new Map<string, ChainAccount>()
  private readonly crossManager: CrossManager

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    this.addAccount(new JVMAccount(provider, wallet))
    this.addAccount(new PlatformAccount(provider, wallet))
    for (const chainId in provider.jevm) {
      this.addAccount(new EVMAccount(provider, chainId, wallet))
    }
    this.crossManager = new CrossManager(provider, wallet)
  }

  addAccount (account: ChainAccount): void {
    this.chainAccounts.set(account.chain.id, account)
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
    if (operation.type === MCNOperationType.Cross) {
      return await this.crossManager.estimateCrossOperation(operation as CrossOperation, this)
    }
    return await account.estimate(operation)
  }

  async execute (executable: ExecutableMCNOperation): Promise<void> {
    this.verifySpendings(executable)
    executable.status = MCNOperationStatus.Executing
    if (executable.summary.chains.length === 1) {
      const account: ChainAccount = this.getAccount(executable.summary.chains[0].id)
      await account.execute(executable)
    } else {
      await this.executeMCNOperation(executable)
    }
    // the only case it is not executing is if an error happened in that case we do not change it
    if (executable.status === MCNOperationStatus.Executing) {
      executable.status = MCNOperationStatus.Done
    }
  }

  private async executeMCNOperation (executable: ExecutableMCNOperation): Promise<void> {
    // this is currently the only multi chain operation available
    // verifications are done in it so keep it like that until newer features are added
    await this.crossManager.executeCrossOperation(executable, this)
  }

  verifySpendings (executable: ExecutableMCNOperation): void {
    const summary: MCNOperationSummary = executable.summary
    const spendings: Map<string, Spending> = this.sortSpendings(summary.spendings)
    spendings.forEach(spending => {
      const account: ChainAccount = this.getAccount(spending.chainId)
      if (spending.amount > account.getValue(spending.assetId)) {
        executable.status = MCNOperationStatus.Error
        throw new AccountError(`missing funds to perform operation: ${summary.operation.type}`)
      }
    })
  }

  private sortSpendings (spendings: Spending[]): Map<string, Spending> {
    const values = new Map<string, Spending>()
    spendings.forEach(spending => {
      const key: string = `${spending.chainId}_${spending.assetId}`
      if (!values.has(key)) {
        values.set(key, new BaseSpending(spending.chainId, spending.amount, spending.assetId))
      } else {
        (values.get(key) as Spending).amount += spending.amount
      }
    })
    return values
  }
}
