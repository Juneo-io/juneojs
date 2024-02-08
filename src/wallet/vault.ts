import { NotImplementedError, VaultError, type MCNProvider } from '../juneo'
import { MCNAccount } from './account'
import { type MCNWallet } from './wallet'

function getAccountId (provider: MCNProvider, wallet: MCNWallet): string {
  const jvmId: string = wallet.getWallet(provider.jvm.chain).getKeyPair().publicKey
  const evmId: string = wallet.getWallet(provider.june.chain).getKeyPair().publicKey
  return `${jvmId}_${evmId}`
}

export class VaultWallet {
  private readonly provider: MCNProvider
  readonly wallet: MCNWallet

  constructor (provider: MCNProvider, wallet: MCNWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  getJVMAddress (): string {
    return this.wallet.getAddress(this.provider.jvm.chain)
  }

  getEVMAddress (): string {
    return this.wallet.getAddress(this.provider.june.chain)
  }

  getIdentifier (): string {
    return getAccountId(this.provider, this.wallet)
  }
}

export class MCNVault {
  private readonly provider: MCNProvider
  readonly account: MCNAccount
  readonly wallets = new Map<string, VaultWallet>()

  constructor (provider: MCNProvider, mainWallet: MCNWallet, wallets: MCNWallet[] = []) {
    this.provider = provider
    this.account = new MCNAccount(provider, mainWallet)
    this.addWallet(mainWallet)
    this.addWallets(wallets)
  }

  addWallet (wallet: MCNWallet): void {
    if (this.hasWallet(wallet)) {
      throw new VaultError('vault already contains this wallet')
    }
    this.wallets.set(getAccountId(this.provider, wallet), new VaultWallet(this.provider, wallet))
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
    return this.wallets.has(getAccountId(this.provider, wallet))
  }

  getWalletWithAddress (address: string): VaultWallet | undefined {
    for (const vaultWallet of this.wallets.values()) {
      for (const chainWallet of vaultWallet.wallet.chainsWallets.values()) {
        if (chainWallet.getAddress() === address) {
          return vaultWallet
        }
      }
    }
    return undefined
  }
}
