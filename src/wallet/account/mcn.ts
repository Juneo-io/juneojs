import { AccountError, sortSpendings } from '../../utils'
import { type MCNWallet } from '../wallet'
import {
  NetworkOperationType, NetworkOperationStatus, type NetworkOperation, type MCNOperationSummary,
  type ExecutableOperation, SummaryType, type ChainOperationSummary, type OperationSummary, type CrossResumeOperationSummary
} from '../operation'
import { type ChainAccount } from './account'
import { EVMAccount } from './evm'
import { JVMAccount } from './jvm'
import { PlatformAccount } from './platform'
import { type Spending } from '../transaction'
import { CrossManager, type CrossResumeOperation, type CrossOperation } from '../cross'
import { type MCNProvider } from '../../juneo'

export class MCNAccount {
  private readonly chainAccounts = new Map<string, ChainAccount>()
  private readonly crossManager: CrossManager

  constructor (provider: MCNProvider, wallet: MCNWallet) {
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
    } else if (operation.type === NetworkOperationType.CrossResume) {
      return await this.crossManager.estimateCrossResumeOperation(operation as CrossResumeOperation, this)
    }
    const account: ChainAccount = this.getAccount(chainId)
    return await account.estimate(operation)
  }

  async execute (summary: OperationSummary, skipVerification: boolean = false): Promise<void> {
    const executable: ExecutableOperation = summary.getExecutable()
    if (!skipVerification) {
      this.verifySpendings(summary)
    }
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
    // those are currently the only multi chain operations available
    // verifications are done in it so keep it like that until newer features are added
    const operation: NetworkOperationType = summary.operation.type
    if (operation === NetworkOperationType.Cross) {
      await this.crossManager.executeCrossOperation(summary, this)
    } else if (operation === NetworkOperationType.CrossResume) {
      const resumeSummary: CrossResumeOperationSummary = summary as CrossResumeOperationSummary
      const resumeOperation: CrossResumeOperation = resumeSummary.operation
      await this.crossManager.import(
        resumeOperation.source, resumeOperation.destination, resumeSummary.payImportFee,
        resumeSummary.importFee, resumeSummary.utxoSet
      )
    }
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
