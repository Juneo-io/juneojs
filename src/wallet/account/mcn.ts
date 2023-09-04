import { AccountError } from '../../utils'
import { type JuneoWallet } from '../wallet'
import { MCNOperationType, MCNOperationStatus, type MCNOperation, MCNOperationSummary, type ExecutableMCNOperation } from '../operation'
import { type ChainAccount } from './account'
import { EVMAccount } from './evm'
import { JVMAccount } from './jvm'
import { PlatformAccount } from './platform'
import { type Spending, BaseSpending, type BaseFeeData } from '../transaction'
import { CrossManager, type CrossOperation } from '../cross'
import { type Blockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'

export class MCNAccount {
  private readonly chainAccounts = new Map<string, ChainAccount>()
  private readonly crossManager: CrossManager

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    const balances: ChainAccount[] = [
      new JVMAccount(provider, wallet),
      new PlatformAccount(provider, wallet)
    ]
    for (const chainId in provider.jevm) {
      balances.push(new EVMAccount(provider, chainId, wallet))
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
      return await this.estimateCross(operation as CrossOperation)
    }
    return await account.estimate(operation)
  }

  private async estimateCross (operation: CrossOperation): Promise<MCNOperationSummary> {
    const chains: Blockchain[] = [operation.source, operation.destination]
    const exportFee: BaseFeeData = await this.crossManager.estimateExport(operation.source, operation.destination, operation.assetId)
    const importFee: BaseFeeData = await this.crossManager.estimateImport(operation.destination, operation.assetId)
    const fees: BaseFeeData[] = [exportFee, importFee]
    const sourceAccount: ChainAccount = this.getAccount(operation.source.id)
    const destinationAccount: ChainAccount = this.getAccount(operation.destination.id)
    const destinationBalance: bigint = destinationAccount.getValue(importFee.assetId)
    const sourceBalance: bigint = sourceAccount.getValue(importFee.assetId)
    const sendImportFee: boolean = this.crossManager.shouldSendImportFee(operation.destination, importFee.amount, destinationBalance, sourceBalance)
    const spendings: Spending[] = [exportFee]
    if (sendImportFee) {
      spendings.push(new BaseSpending(operation.source.id, importFee.amount, importFee.assetId))
    } else {
      spendings.push(importFee)
    }
    return new MCNOperationSummary(operation, chains, fees, spendings)
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
    // TODO IMPLEMENTATION
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
