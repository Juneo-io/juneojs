import { AccountError, sortSpendings } from '../../utils'
import { type JuneoWallet } from '../wallet'
import {
  NetworkOperationType, NetworkOperationStatus, type NetworkOperation, type MCNOperationSummary,
  type ExecutableOperation, SummaryType, type ChainOperationSummary, type OperationSummary
} from '../operation'
import { type ChainAccount } from './account'
import { EVMAccount } from './evm'
import { JVMAccount } from './jvm'
import { PlatformAccount } from './platform'
import { type Spending } from '../transaction'
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

  async fetchAllBalances (): Promise<void> {
    const promises: Array<Promise<void>> = []
    this.chainAccounts.forEach(account => {
      promises.push(account.fetchAllBalances())
    })
    await Promise.all(promises)
  }

  async estimate (chainId: string, operation: NetworkOperation): Promise<OperationSummary> {
    if (operation.type === NetworkOperationType.Cross) {
      return await this.crossManager.estimateCrossOperation(operation as CrossOperation, this)
    }
    const account: ChainAccount = this.getAccount(chainId)
    return await account.estimate(operation)
  }

  async execute (summary: OperationSummary): Promise<void> {
    const executable: ExecutableOperation = summary.getExecutable()
    this.verifySpendings(summary)
    executable.status = NetworkOperationStatus.Executing
    if (summary.type === SummaryType.Chain) {
      const chainSummary: ChainOperationSummary = summary as ChainOperationSummary
      const account: ChainAccount = this.getAccount(chainSummary.chain.id)
      await account.execute(chainSummary)
    } else if (summary.type === SummaryType.MCN) {
      await this.executeMCNOperation(summary as MCNOperationSummary)
    }
    // the only case it is not executing is if an error happened in that case we do not change it
    if (executable.status === NetworkOperationStatus.Executing) {
      executable.status = NetworkOperationStatus.Done
    }
  }

  private async executeMCNOperation (summary: MCNOperationSummary): Promise<void> {
    // this is currently the only multi chain operation available
    // verifications are done in it so keep it like that until newer features are added
    await this.crossManager.executeCrossOperation(summary, this)
  }

  verifySpendings (summary: OperationSummary): void {
    const executable: ExecutableOperation = summary.getExecutable()
    const spendings: Map<string, Spending> = sortSpendings(summary.spendings)
    spendings.forEach(spending => {
      const account: ChainAccount = this.getAccount(spending.chain.id)
      if (spending.amount > account.getValue(spending.assetId)) {
        executable.status = NetworkOperationStatus.Error
        throw new AccountError(`missing funds to perform operation: ${summary.operation.type}`)
      }
    })
  }
}
