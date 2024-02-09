import { type MCNProvider } from '../juneo'
import { NotImplementedError, VaultError } from '../utils'
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
    this.addVaultWallet(new VaultWallet(this.provider, wallet))
  }

  addWallets (wallets: MCNWallet[]): void {
    for (const wallet of wallets) {
      this.addWallet(wallet)
    }
  }

  private addVaultWallet (vaultWallet: VaultWallet): void {
    if (this.wallets.has(vaultWallet.getIdentifier())) {
      throw new VaultError('vault already contains this wallet')
    }
    this.wallets.set(vaultWallet.getIdentifier(), vaultWallet)
    this.account.addSigner(vaultWallet.wallet)
  }

  // Temporarily avoid it before fixing issue with signers to update too
  setMainWallet (wallet: VaultWallet): void {
    throw new NotImplementedError('not implemented yet')
    // if (!this.wallets.has(wallet.getIdentifier())) {
    //   this.addVaultWallet(wallet)
    // }
    // this.account = new MCNAccount(this.provider, wallet.wallet)
  }

  removeWallet (wallet: MCNWallet): void {
    throw new NotImplementedError('not implemented yet')
  }

  hasWallet (wallet: MCNWallet): boolean {
    return this.wallets.has(getAccountId(this.provider, wallet))
  }

  getWallet (identifier: string): VaultWallet {
    const wallet: VaultWallet | undefined = this.wallets.get(identifier)
    if (typeof wallet === 'undefined') {
      throw new VaultError(`there is no wallet with identifier: ${identifier}`)
    } else {
      return wallet
    }
  }

  /**
   * @deprecated
   */
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
