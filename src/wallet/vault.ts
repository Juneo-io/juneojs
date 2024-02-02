import { type MCNProvider } from '../juneo'
import { type MCNAccount } from './account'

export class MCNVault {
  private readonly provider: MCNProvider
  private mainAccount: MCNAccount
  private readonly accounts = new Map<string, MCNAccount>()

  constructor (provider: MCNProvider, mainAccount: MCNAccount, accounts: MCNAccount[]) {
    this.provider = provider
    this.mainAccount = mainAccount
    if (!this.hasAccount(mainAccount)) {
      this.addAccount(mainAccount)
    }
    this.addAccounts(accounts)
  }

  addAccount (account: MCNAccount): void {
    this.accounts.set(MCNVault.getAccountId(this.provider, account), account)
  }

  addAccounts (accounts: MCNAccount[]): void {
    for (const account of accounts) {
      this.addAccount(account)
    }
  }

  setMainAccount (account: MCNAccount): void {
    this.mainAccount = account
    if (!this.hasAccount(account)) {
      this.addAccount(account)
    }
  }

  hasAccount (account: MCNAccount): boolean {
    return this.accounts.has(MCNVault.getAccountId(this.provider, account))
  }

  getAccountWithAddress (address: string): MCNAccount | undefined {
    for (const account of this.accounts.values()) {
      for (const chainAccount of account.chainAccounts.values()) {
        if (chainAccount.address === address) {
          return account
        }
      }
    }
    return undefined
  }

  getMainAccount (): MCNAccount {
    return this.mainAccount
  }

  getAddresses (chainId: string): string[] {
    const addresses: string[] = []
    for (const account of this.accounts.values()) {
      addresses.push(account.getAccount(chainId).address)
    }
    return addresses
  }

  private static getAccountId (provider: MCNProvider, account: MCNAccount): string {
    const jvmId: string = account.getAccount(provider.jvm.chain.id).chainWallet.getKeyPair().publicKey
    const evmId: string = account.getAccount(provider.june.chain.id).chainWallet.getKeyPair().publicKey
    return `${jvmId}_${evmId}`
  }
}
