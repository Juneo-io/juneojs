import { HDNodeWallet, Mnemonic, randomBytes, Wallet } from 'ethers'
import { VMType, type Blockchain, type JEVMBlockchain } from '../chain'
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

class NodeManager {
  mnemonic: string

  constructor (mnemonic: string) {
    this.mnemonic = mnemonic
  }

  derivePrivateKey (chain: Blockchain, index: number): string {
    const hdNode = HDNodeWallet.fromPhrase(this.mnemonic, '', `m/44'/${chain.vm.hdPath}'/0'/0`)
    return hdNode.deriveChild(index).privateKey.substring(2)
  }
}

export class MCNWallet {
  hrp: string
  private nodeManager?: NodeManager
  mnemonic?: string
  privateKey?: string
  chainsWallets = new Map<string, VMWallet>()

  public constructor (hrp: string, data: string | number) {
    this.hrp = hrp
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

  private recover (data: string): void {
    if (Mnemonic.isValidMnemonic(data)) {
      this.setMnemonic(data)
    } else if (validatePrivateKey(data)) {
      this.setPrivateKey(data)
    } else {
      throw new WalletError('invalid recovery data provided')
    }
  }

  private generate (wordsCount: number): void {
    if (wordsCount % 3 !== 0 || wordsCount < 12 || wordsCount > 24) {
      throw new WalletError(`words count must be min 12 and max 24 and multiple of 3 but got: ${wordsCount}`)
    }
    const strength = (wordsCount / 3) * 4
    const mnemonic = Mnemonic.fromEntropy(randomBytes(strength)).phrase
    this.recover(mnemonic)
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
