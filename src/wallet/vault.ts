import { NotImplementedError, type MCNProvider } from '../juneo'
import { MCNAccount } from './account'
import { type MCNWallet } from './wallet'

export class MCNVault {
  private readonly provider: MCNProvider
  private readonly account: MCNAccount
  private readonly wallets = new Map<string, MCNWallet>()

  constructor (provider: MCNProvider, mainWallet: MCNWallet, wallets: MCNWallet[]) {
    this.provider = provider
    this.account = new MCNAccount(provider, mainWallet)
    this.addWallet(mainWallet)
    this.addWallets(wallets)
  }

  addWallet (wallet: MCNWallet): void {
    if (this.hasWallet(wallet)) {
      return
    }
    this.wallets.set(MCNVault.getAccountId(this.provider, wallet), wallet)
    this.account.addSigner(wallet)
  }

  addWallets (wallets: MCNWallet[]): void {
    for (const wallet of wallets) {
      this.addWallet(wallet)
    }
  }

  // Temporarily avoid it before fixing issue with signers to update too
  setMainWallet (wallet: MCNWallet): void {
    throw new NotImplementedError('not implemented yet')
    //   if (!this.hasAccount(account)) {
    //     this.addAccount(account)
    //   }
    //   this.mainAccount = account
  }

  removeWallet (wallet: MCNWallet): void {
    throw new NotImplementedError('not implemented yet')
  }

  hasWallet (wallet: MCNWallet): boolean {
    return this.wallets.has(MCNVault.getAccountId(this.provider, wallet))
  }

  getWalletWithAddress (address: string): MCNWallet | undefined {
    for (const wallet of this.wallets.values()) {
      for (const chainWallet of wallet.chainsWallets.values()) {
        if (chainWallet.getAddress() === address) {
          return wallet
        }
      }
    }
    return undefined
  }

  getAccount (): MCNAccount {
    return this.account
  }

  private static getAccountId (provider: MCNProvider, wallet: MCNWallet): string {
    const jvmId: string = wallet.getWallet(provider.jvm.chain).getKeyPair().publicKey
    const evmId: string = wallet.getWallet(provider.june.chain).getKeyPair().publicKey
    return `${jvmId}_${evmId}`
  }
}
