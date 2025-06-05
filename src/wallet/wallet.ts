import { HDNodeWallet, Mnemonic, randomBytes, Wallet, type HDNodeVoidWallet } from 'ethers'
import { VMType, type Blockchain, type JEVMBlockchain } from '../chain'
import { MainNetwork } from '../network'
import { type Address, type Signer } from '../transaction'
import {
  ECKeyPair,
  encodeJuneoAddress,
  JuneoBuffer,
  JVMPrivateKeyPrefix,
  validatePrivateKey,
  WalletError
} from '../utils'
import * as encoding from '../utils/encoding'

// Create a map type for xpubs, where each VMType can have an optional xpub string
export type XpubMap = Partial<Record<VMType, string>>

class NodeManager {
  mnemonic: string

  constructor (mnemonic: string) {
    this.mnemonic = mnemonic
  }

  derivePrivateKey (chain: Blockchain, index: number): string {
    const hdNode = HDNodeWallet.fromPhrase(this.mnemonic, '', `m/44'/${chain.vm.hdPath}'/0'/0`)
    return hdNode.deriveChild(index).privateKey.substring(2)
  }

  // Derive the extended public key for a given chain and index
  derivateXPublicKey (chain: Blockchain, index: number): string {
    const hdNode = HDNodeWallet.fromPhrase(this.mnemonic, '', `m/44'/${chain.vm.hdPath}'/0'/0`)
    return hdNode.deriveChild(index).neuter().extendedKey
  }
}

export class MCNWallet {
  hrp: string
  private nodeManager?: NodeManager
  mnemonic?: string
  privateKey?: string
  chainsWallets = new Map<string, VMWallet>()
  xpubs?: XpubMap
  readOnlyWallet: boolean = false

  public constructor (hrp: string, data: string | number, readOnly = false) {
    this.hrp = hrp

    // in case of read-only wallet, we don't need to set the mnemonic or private key
    if (readOnly) {
      this.readOnlyWallet = readOnly
      return
    }
    if (typeof data === 'string') {
      this.recover(data)
    } else if (typeof data === 'number') {
      this.generate(data)
    }
  }

  getAddress (chain: Blockchain): string {
    return this.getWallet(chain).getAddress()
  }

  getWallet (chain: Blockchain): VMWallet {
    if (!this.chainsWallets.has(chain.id)) {
      const wallet = this.getVMWallet(chain)
      this.chainsWallets.set(chain.id, wallet)
    }
    return this.chainsWallets.get(chain.id)!
  }

  getJEVMWallet (chain: JEVMBlockchain): JEVMWallet {
    return this.getWallet(chain) as JEVMWallet
  }

  getWallets (): VMWallet[] {
    const wallets: VMWallet[] = []
    for (const wallet of this.chainsWallets.values()) {
      wallets.push(wallet)
    }
    return wallets
  }

  setHrp (hrp: string): void {
    this.hrp = hrp
    this.chainsWallets.clear()
  }

  private getVMWallet (chain: Blockchain): VMWallet {
    // Handle read-only mode with xpubs
    // we use the ReadOnlyJVMWallet or ReadOnlyJEVMWallet depending on the chain type
    if (this.readOnlyWallet && this.xpubs !== undefined) {
      const vmType = chain.vm.type
      const xpub = this.xpubs[vmType]
      if (xpub === undefined || xpub === '') {
        throw new WalletError(`No xpub for vm type ${vmType}`)
      }
      if (vmType === VMType.JVM) {
        return new ReadOnlyJVMWallet(xpub, this.hrp, chain)
      }
      if (vmType === VMType.EVM) {
        return new ReadOnlyJEVMWallet(xpub, this.hrp, chain)
      }
      throw new WalletError(`unsupported vm type: ${vmType}`)
    }

    const privateKey = this.getVMWalletPrivateKey(chain)
    switch (chain.vm.type) {
      case VMType.EVM: {
        return new JEVMWallet(privateKey, this.hrp, chain)
      }
      case VMType.JVM: {
        return new JVMWallet(privateKey, this.hrp, chain)
      }
      default: {
        throw new WalletError(`unsupported vm type: ${chain.vm.type}`)
      }
    }
  }

  private getVMWalletPrivateKey (chain: Blockchain): string {
    // if the wallet is read-only, we cannot derive a private key
    if (this.readOnlyWallet) {
      throw new WalletError('cannot derive private key for read-only wallet')
    }

    if (this.nodeManager !== undefined) {
      return this.nodeManager.derivePrivateKey(chain, 0)
    } else if (this.privateKey !== undefined) {
      return this.privateKey
    }
    throw new WalletError('missing recovery data to build wallet')
  }

  private setMnemonic (mnemonic: string): void {
    if (!Mnemonic.isValidMnemonic(mnemonic)) {
      throw new WalletError('invalid mnemonic provided')
    }
    this.nodeManager = new NodeManager(mnemonic)
    this.mnemonic = mnemonic
  }

  private setPrivateKey (privateKey: string): void {
    // should only be hex or bs58 private key after validate
    if (encoding.isHex(privateKey)) {
      privateKey = encoding.hasHexPrefix(privateKey) ? privateKey.substring(2) : privateKey
    } else {
      privateKey = encoding.decodeCB58(privateKey.split('-')[1]).toHex()
    }
    this.privateKey = privateKey
  }

  /**
   * @deprecated
   */
  static recover (data: string, hrp?: string): MCNWallet {
    if (typeof hrp === 'undefined') {
      hrp = MainNetwork.hrp
    }
    return new MCNWallet(hrp, data)
  }

  private recover (data: string): void {
    if (Mnemonic.isValidMnemonic(data)) {
      this.setMnemonic(data)
    } else if (validatePrivateKey(data)) {
      this.setPrivateKey(data)
    } else {
      throw new WalletError('invalid recovery data provided')
    }
  }

  /**
   * @deprecated
   */
  static generate (words: number = 12, hrp?: string): MCNWallet {
    if (typeof hrp === 'undefined') {
      hrp = MainNetwork.hrp
    }
    return new MCNWallet(hrp, words)
  }

  private generate (wordsCount: number): void {
    if (wordsCount % 3 !== 0 || wordsCount < 12 || wordsCount > 24) {
      throw new WalletError(`words count must be min 12 and max 24 and multiple of 3 but got: ${wordsCount}`)
    }
    const strength = (wordsCount / 3) * 4
    const mnemonic = Mnemonic.fromEntropy(randomBytes(strength)).phrase
    this.recover(mnemonic)
  }

  /**
   * Creates an MCNWallet instance from a set of xpubs.
   * This method is used to initialize a read-only wallet.
   *
   * @param hrp - The human-readable part of the address.
   * @param xpubs - A map of VMType to xpub strings, representing the extended public keys for each VM type.
   * @returns An instance of MCNWallet configured as a read-only.
   */
  static fromXpubs (
    hrp: string,
    xpubs: XpubMap
  ): MCNWallet {
    // if the xpubs are empty, throw an error
    if (Object.keys(xpubs).length === 0) {
      throw new WalletError('xpubs cannot be empty for read-only wallet')
    }

    // Create a new MCNWallet instance with the provided hrp and set it as read-only
    const wallet = new MCNWallet(hrp, '', true)

    // Set the xpubs and mark the wallet as read-only
    wallet.xpubs = xpubs

    // Clear any existing chainsWallets
    // This ensures that the wallet is initialized with the new xpubs and chains
    wallet.chainsWallets.clear()

    return wallet
  }
}

export interface VMWallet extends Signer {
  getAddress: () => string

  getJuneoAddress: () => string

  getKeyPair: () => ECKeyPair
}

abstract class AbstractVMWallet implements VMWallet {
  private readonly keyPair: ECKeyPair
  chain: Blockchain
  juneoAddress: string
  protected address?: string

  constructor (privateKey: string, hrp: string, chain: Blockchain) {
    this.keyPair = new ECKeyPair(privateKey)
    this.chain = chain
    this.juneoAddress = encodeJuneoAddress(this.keyPair.publicKey, hrp)
  }

  getAddress (): string {
    if (typeof this.address === 'undefined') {
      return this.getJuneoAddress()
    }
    return this.address
  }

  getJuneoAddress (): string {
    if (this.chain.aliases.length > 0) {
      return `${this.chain.aliases[0]}-${this.juneoAddress}`
    }
    return `${this.chain.id}-${this.juneoAddress}`
  }

  getKeyPair (): ECKeyPair {
    return this.keyPair
  }

  async sign (bytes: JuneoBuffer): Promise<JuneoBuffer> {
    return this.keyPair.sign(bytes)
  }

  matches (address: Address): boolean {
    return address.matches(this.getAddress()) || address.matches(this.juneoAddress)
  }
}

export abstract class AbstractReadOnlyVMWallet implements VMWallet {
  chain: Blockchain
  juneoAddress: string
  protected address?: string

  constructor (publicKey: string, hrp: string, chain: Blockchain) {
    this.chain = chain
    this.juneoAddress = encodeJuneoAddress(publicKey, hrp)
  }

  getAddress (): string {
    if (typeof this.address === 'undefined') {
      return this.getJuneoAddress()
    }
    return this.address
  }

  getJuneoAddress (): string {
    if (this.chain.aliases.length > 0) {
      return `${this.chain.aliases[0]}-${this.juneoAddress}`
    }
    return `${this.chain.id}-${this.juneoAddress}`
  }

  getKeyPair (): ECKeyPair {
    throw new WalletError('Cannot get private key of read-only wallet')
  }

  async sign (): Promise<any> {
    throw new WalletError('Read-only wallet cannot sign transactions')
  }

  matches (address: Address): boolean {
    return address.matches(this.getAddress()) || address.matches(this.juneoAddress)
  }

  protected getChildNodeAt0 (xpub: string): HDNodeWallet | HDNodeVoidWallet {
    const hdNode = HDNodeWallet.fromExtendedKey(xpub)
    return hdNode.deriveChild(0)
  }
}

export class JVMWallet extends AbstractVMWallet {
  jvmPrivateKey: string

  constructor (privateKey: string, hrp: string, chain: Blockchain) {
    super(privateKey, hrp, chain)
    const jvmKey: string = encoding.encodeCB58(JuneoBuffer.fromString(privateKey, 'hex'))
    this.jvmPrivateKey = `${JVMPrivateKeyPrefix}${jvmKey}`
  }
}

export class JEVMWallet extends AbstractVMWallet {
  evmWallet: Wallet
  nonce: bigint = BigInt(0)
  synchronized: boolean = false

  constructor (privateKey: string, hrp: string, chain: Blockchain) {
    super(privateKey, hrp, chain)
    this.evmWallet = new Wallet(privateKey)
    this.address = this.evmWallet.address
  }
}

export class ReadOnlyJVMWallet extends AbstractReadOnlyVMWallet {
  protected xpub: string
  hrp: string

  constructor (xpub: string, hrp: string, chain: Blockchain) {
    super(xpub, hrp, chain)

    const child = super.getChildNodeAt0(xpub)

    const address = chain.aliases.length > 0
      ? `${chain.aliases[0]}-${encodeJuneoAddress(child.publicKey, hrp)}`
      : `${chain.id}-${encodeJuneoAddress(child.publicKey, hrp)}`

    this.xpub = xpub
    this.hrp = hrp
    this.address = address
  }
}

export class ReadOnlyJEVMWallet extends AbstractReadOnlyVMWallet {
  protected xpub: string

  constructor (xpub: string, hrp: string, chain: Blockchain) {
    super(xpub, hrp, chain)

    const child = super.getChildNodeAt0(xpub)
    const address = child.address

    this.xpub = xpub
    this.address = address
  }
}
