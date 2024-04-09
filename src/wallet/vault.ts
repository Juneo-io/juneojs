import { type MCNProvider } from '../juneo'
import { VaultError } from '../utils'
import { AccountType, MCNAccount } from './account'
import { type VMWallet, type MCNWallet } from './wallet'

function getAccountId (provider: MCNProvider, wallet: MCNWallet): string {
  const jvmId: string = wallet.getWallet(provider.jvmChain).getKeyPair().publicKey
  const evmId: string = wallet.getWallet(provider.juneChain).getKeyPair().publicKey
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
    return this.wallet.getAddress(this.provider.jvmChain)
  }

  getEVMAddress (): string {
    return this.wallet.getAddress(this.provider.juneChain)
  }

  getIdentifier (): string {
    return getAccountId(this.provider, this.wallet)
  }
}

export class MCNVault {
  private readonly provider: MCNProvider
  account: MCNAccount
  readonly wallets = new Map<string, VaultWallet>()

  constructor (provider: MCNProvider, mainWallet: MCNWallet, wallets: MCNWallet[] = []) {
    this.provider = provider
    this.account = new MCNAccount(provider, mainWallet)
    const vaultWallet: VaultWallet = new VaultWallet(provider, mainWallet)
    this.wallets.set(vaultWallet.getIdentifier(), vaultWallet)
    this.addWallets(wallets)
  }

  addWallet (wallet: MCNWallet): void {
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
    // adding new wallets as signers
    for (const chainAccount of this.account.chainAccounts.values()) {
      if (chainAccount.type === AccountType.Utxo) {
        const signer: VMWallet = vaultWallet.wallet.getWallet(chainAccount.chain)
        chainAccount.signers.push(signer)
      }
    }
  }

  setMainWallet (vaultWallet: VaultWallet): void {
    // reset all signers of previous account to avoid errors if switching back to it later
    for (const chainAccount of this.account.chainAccounts.values()) {
      chainAccount.signers = [chainAccount.chainWallet]
    }
    // remove self before adding signers to avoid duplicate signers
    if (this.wallets.has(vaultWallet.getIdentifier())) {
      this.wallets.delete(vaultWallet.getIdentifier())
    }
    this.account = new MCNAccount(this.provider, vaultWallet.wallet)
    // adding all registered signers to new main account
    for (const chainAccount of this.account.chainAccounts.values()) {
      if (chainAccount.type === AccountType.Utxo) {
        for (const wallet of this.wallets.values()) {
          const signer: VMWallet = wallet.wallet.getWallet(chainAccount.chain)
          chainAccount.signers.push(signer)
        }
      }
    }
    this.wallets.set(vaultWallet.getIdentifier(), vaultWallet)
  }

  removeWallet (wallet: MCNWallet): void {
    const identifier: string = getAccountId(this.provider, wallet)
    if (identifier === getAccountId(this.provider, this.account.wallet)) {
      throw new VaultError('cannot remove main wallet')
    }
    // removing wallet
    if (!this.wallets.delete(identifier)) {
      throw new VaultError('wallet is not in vault')
    }
    // removing signers from chain accounts in mainWallet (= account)
    for (const chainAccount of this.account.chainAccounts.values()) {
      if (chainAccount.type === AccountType.Utxo) {
        const signers: VMWallet[] = []
        for (const vaultWallet of this.wallets.values()) {
          const signer: VMWallet = vaultWallet.wallet.getWallet(chainAccount.chain)
          signers.push(signer)
        }
        chainAccount.signers = signers
      }
    }
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
}
