import { type MCNProvider } from '../../juneo'
import { AccountError } from '../../utils'
import { type JuneoWallet } from '../wallet'
import { MCNOperationType, MCNOperationStatus, type MCNOperation, type MCNOperationSummary, type ExecutableMCNOperation } from '../operation'
import { type ChainAccount } from './account'
import { EVMAccount } from './evm'
import { JVMAccount } from './jvm'
import { PlatformAccount } from './platform'

export class MCNAccount {
  private readonly chainAccounts = new Map<string, ChainAccount>()

  constructor (accounts: ChainAccount[]) {
    accounts.forEach(account => {
      this.chainAccounts.set(account.chain.id, account)
    })
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
    return await account.estimate(operation).catch(error => {
      throw error
    })
  }

  async execute (executable: ExecutableMCNOperation): Promise<void> {
    executable.status = MCNOperationStatus.Executing
    const account: ChainAccount = this.getAccount(executable.summary.chain.id)
    await account.execute(executable).catch(error => {
      throw error
    })
    // the only case it is not executing is if an error happened in that case we do not change it
    if (executable.status === MCNOperationStatus.Executing) {
      executable.status = MCNOperationStatus.Done
    }
  }

  static from (provider: MCNProvider, wallet: JuneoWallet): MCNAccount {
    const balances: ChainAccount[] = [
      new JVMAccount(provider, wallet),
      new PlatformAccount(provider, wallet)
    ]
    for (const chainId in provider.jevm) {
      balances.push(new EVMAccount(provider, chainId, wallet))
    }
    return new MCNAccount(balances)
  }
}
