import { AccountError, sortSpendings } from '../../utils'
import { type MCNWallet } from '../wallet'
import {
  NetworkOperationType,
  NetworkOperationStatus,
  type NetworkOperation,
  type CrossOperationSummary,
  type ExecutableOperation,
  type ChainOperationSummary,
  type OperationSummary,
  type CrossResumeOperationSummary,
  NetworkOperationRange,
  type ChainNetworkOperation,
  type CrossResumeOperation,
  type CrossOperation
} from '../operation'
import { type ChainAccount } from './account'
import { EVMAccount } from './evm'
import { JVMAccount } from './jvm'
import { PlatformAccount } from './platform'
import { type Spending } from '../transaction'
import { CrossManager } from '../cross'
import { type Blockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'

export class MCNAccount {
  private readonly chainAccounts = new Map<string, ChainAccount>()
  private readonly crossManager: CrossManager
  private executingChains: string[] = []

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
    this.chainAccounts.forEach((account) => {
      promises.push(account.fetchAllBalances())
    })
    await Promise.all(promises)
  }

  async fetchUnfinishedCrossOperations (): Promise<CrossResumeOperation[]> {
    return await this.crossManager.fetchUnfinishedCrossOperations()
  }

  async estimate (operation: NetworkOperation): Promise<OperationSummary> {
    if (operation.type === NetworkOperationType.Cross) {
      return await this.crossManager.estimateCrossOperation(operation as CrossOperation, this)
    }
    if (operation.type === NetworkOperationType.CrossResume) {
      return await this.crossManager.estimateCrossResumeOperation(operation as CrossResumeOperation, this)
    }
    if (operation.range !== NetworkOperationRange.Chain) {
      throw new AccountError(`unsupported operation range: ${operation.range}`)
    }
    const chainOperation: ChainNetworkOperation = operation as ChainNetworkOperation
    const account: ChainAccount = this.getAccount(chainOperation.chain.id)
    return await account.estimate(chainOperation)
  }

  async execute (summary: OperationSummary, skipVerifications: boolean = false): Promise<void> {
    const executable: ExecutableOperation = summary.getExecutable()
    if (!skipVerifications && this.verifyChains(summary.getChains()).length > 0) {
      executable.status = NetworkOperationStatus.Error
      throw new AccountError('an operation is already being executed on a chain')
    }
    if (!skipVerifications && this.verifySpendings(summary).length > 0) {
      executable.status = NetworkOperationStatus.Error
      throw new AccountError(`missing funds to perform operation: ${summary.operation.type}`)
    }
    executable.status = NetworkOperationStatus.Executing
    const range: NetworkOperationRange = summary.operation.range
    if (summary.operation.type === NetworkOperationType.CrossResume) {
      const resumeSummary: CrossResumeOperationSummary = summary as CrossResumeOperationSummary
      await this.executeOperation(
        summary,
        this.crossManager.executeCrossResumeOperation(resumeSummary, this.getAccount(resumeSummary.chain.id))
      )
    } else if (range === NetworkOperationRange.Chain) {
      const chainSummary: ChainOperationSummary = summary as ChainOperationSummary
      const account: ChainAccount = this.getAccount(chainSummary.chain.id)
      await this.executeOperation(summary, account.execute(chainSummary))
    } else if (range === NetworkOperationRange.Supernet) {
      await this.executeOperation(summary, this.executeSupernetOperation(summary))
    } else {
      throw new AccountError(`unsupported operation range: ${range}`)
    }
  }

  private async executeSupernetOperation (summary: OperationSummary): Promise<void> {
    // cross operation is currently the only supernet operation available
    // verifications are done in it so keep it like that until newer features are added
    const operation: NetworkOperationType = summary.operation.type
    if (operation === NetworkOperationType.Cross) {
      await this.crossManager.executeCrossOperation(summary as CrossOperationSummary, this)
    } else {
      throw new AccountError(`unsupported supernet operation: ${operation}`)
    }
  }

  private async executeOperation (summary: OperationSummary, execution: Promise<void>): Promise<void> {
    let error: Error | undefined
    const executable: ExecutableOperation = summary.getExecutable()
    await execution.then(
      () => {
        // the only case it is not executing is if an error happened in that case we do not change it
        if (executable.status === NetworkOperationStatus.Executing) {
          executable.status = NetworkOperationStatus.Done
        }
      },
      (err) => {
        error = err
      }
    )
    if (error === undefined) {
      // unlock the chains
      this.executingChains = []
      return
    }
    // error occured case
    executable.status = NetworkOperationStatus.Error
    // most of the operations require to refetch balances but error could have cancelled it
    // try to restore a proper state by fetching them all
    for (const chain of summary.getChains()) {
      await this.getAccount(chain.id).fetchAllBalances()
    }
    this.executingChains = []
    throw error
  }

  verifySpendings (summary: OperationSummary): Spending[] {
    const spendings: Map<string, Spending> = sortSpendings(summary.spendings)
    const faulty: Spending[] = []
    spendings.forEach((spending) => {
      const account: ChainAccount = this.getAccount(spending.chain.id)
      if (spending.amount > account.getValue(spending.assetId)) {
        faulty.push(spending)
      }
    })
    return faulty
  }

  verifyChains (chains: Blockchain[]): string[] {
    const faulty: string[] = []
    chains.forEach((chain) => {
      if (this.executingChains.includes(chain.id)) {
        faulty.push(chain.id)
      }
    })
    return faulty
  }
}
