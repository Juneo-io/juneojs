import { type MCNAccount } from './account'

export class MCNVault {
  mainAccount: MCNAccount
  accounts: MCNAccount[] = []

  constructor (mainAccount: MCNAccount) {
    this.mainAccount = mainAccount
  }

  addAccount (account: MCNAccount): void {
    this.accounts.push(account)
  }

  setMainAccount (account: MCNAccount): void {
    this.mainAccount = account
  }
}
