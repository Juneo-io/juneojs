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
    this.mainAccount.addSignerAccount(account)
  }

  addAccounts (accounts: MCNAccount[]): void {
    for (const account of accounts) {
      this.addAccount(account)
    }
  }

  // Temporarily avoid it before fixing issue with signers to update too
  // setMainAccount (account: MCNAccount): void {
  //   if (!this.hasAccount(account)) {
  //     this.addAccount(account)
  //   }
  //   this.mainAccount = account
  // }

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

  private static getAccountId (provider: MCNProvider, account: MCNAccount): string {
    const jvmId: string = account.getAccount(provider.jvm.chain.id).chainWallet.getKeyPair().publicKey
    const evmId: string = account.getAccount(provider.june.chain.id).chainWallet.getKeyPair().publicKey
    return `${jvmId}_${evmId}`
  }
}
