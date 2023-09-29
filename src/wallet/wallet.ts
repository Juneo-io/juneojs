import { Wallet } from 'ethers'
import { JEVM_ID, type Blockchain, JVM_ID, PLATFORMVM_ID, type JEVMBlockchain } from '../chain'
import { ECKeyPair, JuneoBuffer, rmd160, sha256, WalletError } from '../utils'
import * as encoding from '../utils/encoding'
import * as bip39 from 'bip39'
import hdKey from 'hdkey'

const EVMHdPath = "m/44'/60'/0'/0/0"
const JVMHdPath = "m/44'/9000'/0'/0/0"

const JVMPrivateKeyPrefix = 'PrivateKey-'
const PrivateKeyLength: number = 64
const DefaultHrp = 'socotra'

export class MCNWallet {
  hrp: string
  mnemonic: string | undefined
  private hdNode: hdKey | undefined
  privateKey: string | undefined
  chainsWallets = new Map<string, VMWallet>()

  private constructor (hrp: string = DefaultHrp) {
    this.hrp = hrp
  }

  getAddress (chain: Blockchain): string {
    if (!this.chainsWallets.has(chain.id)) {
      this.setChainWallet(chain)
    }
    return this.getWallet(chain).getAddress()
  }

  getWallet (chain: Blockchain): VMWallet {
    if (!this.chainsWallets.has(chain.id)) {
      this.setChainWallet(chain)
    }
    return this.chainsWallets.get(chain.id) as VMWallet
  }

  getJEVMWallet (chain: JEVMBlockchain): JEVMWallet {
    return this.getWallet(chain) as JEVMWallet
  }

  getWallets (): VMWallet[] {
    const wallets: VMWallet[] = []
    this.chainsWallets.forEach((wallet) => {
      wallets.push(wallet)
    })
    return wallets
  }

  private setChainWallet (chain: Blockchain): void {
    if (chain.vmId === JEVM_ID) {
      this.chainsWallets.set(chain.id, this.buildJEVMWallet(chain))
    } else if (chain.vmId === JVM_ID) {
      this.chainsWallets.set(chain.id, this.buildJVMWallet(chain))
    } else if (chain.vmId === PLATFORMVM_ID) {
      this.chainsWallets.set(chain.id, this.buildJVMWallet(chain))
    } else {
      throw new WalletError(`unsupported vm id: ${chain.vmId}`)
    }
  }

  private buildJVMWallet (chain: Blockchain): JVMWallet {
    let wallet: JVMWallet | undefined
    if (this.hdNode !== undefined) {
      const privateKey = this.hdNode.derive(JVMHdPath).privateKey.toString('hex')
      wallet = new JVMWallet(privateKey, this.hrp, chain)
    } else if (this.privateKey !== undefined) {
      wallet = new JVMWallet(this.privateKey, this.hrp, chain)
    }
    if (wallet === undefined) {
      throw new WalletError('missing recovery data to build wallet')
    }
    return wallet
  }

  private buildJEVMWallet (chain: Blockchain): JEVMWallet {
    let wallet: JEVMWallet | undefined
    if (this.hdNode !== undefined) {
      const privateKey = this.hdNode.derive(EVMHdPath).privateKey.toString('hex')
      wallet = new JEVMWallet(privateKey, this.hrp, chain)
    } else if (this.privateKey !== undefined) {
      wallet = new JEVMWallet(this.privateKey, this.hrp, chain)
    }
    if (wallet === undefined) {
      throw new WalletError('missing recovery data to build wallet')
    }
    return wallet
  }

  private setMnemonic (mnemonic: string): void {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new WalletError('invalid mnemonic provided')
    }
    this.mnemonic = mnemonic
    this.hdNode = hdKey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic))
  }

  static recover (data: string, hrp?: string): MCNWallet {
    if (bip39.validateMnemonic(data)) {
      const wallet: MCNWallet = new MCNWallet(hrp)
      wallet.setMnemonic(data)
      return wallet
    }
    if (MCNWallet.validatePrivateKey(data)) {
      const wallet: MCNWallet = new MCNWallet(hrp)
      let privateKey: string = data
      // should only be hex or bs58 private key after validate
      if (encoding.isHex(privateKey)) {
        privateKey = encoding.hasHexPrefix(privateKey) ? privateKey.substring(2) : privateKey
      } else {
        privateKey = encoding.decodeCB58(privateKey.split('-')[1]).toHex()
      }
      wallet.privateKey = privateKey
      return wallet
    }
    throw new WalletError('invalid recovery data provided')
  }

  static generate (words: number = 12, hrp?: string): MCNWallet {
    if (words !== 12 && words !== 24) {
      throw new WalletError('words count must be 12 or 24')
    }
    const strength: number = words === 12 ? 128 : 256
    const mnemonic = bip39.generateMnemonic(strength)
    const wallet = MCNWallet.recover(mnemonic, hrp)
    return wallet
  }

  static validatePrivateKey (data: string): boolean {
    if (encoding.isHex(data)) {
      const hasPrefix: boolean = encoding.hasHexPrefix(data)
      const length = hasPrefix ? data.substring(2).length : data.length
      return length === PrivateKeyLength
    }
    if (data.includes(JVMPrivateKeyPrefix)) {
      const split: string[] = data.split('-')
      const isBase58: boolean = split.length > 1 && encoding.isBase58(split[1])
      return isBase58 && encoding.decodeCB58(split[1]).length === PrivateKeyLength
    }
    return false
  }
}

export interface VMWallet {
  getAddress: () => string

  getJuneoAddress: () => string

  getChain: () => Blockchain

  sign: (buffer: JuneoBuffer) => JuneoBuffer
}

export abstract class AbstractVMWallet implements VMWallet {
  privateKey: string
  private readonly keyPair: ECKeyPair
  hrp: string
  chain: Blockchain
  juneoAddress: string
  address?: string

  constructor (privateKey: string, hrp: string, chain: Blockchain, address?: string) {
    this.privateKey = privateKey
    this.keyPair = new ECKeyPair(privateKey)
    this.hrp = hrp
    this.chain = chain
    this.juneoAddress = AbstractVMWallet.encodeJuneoAddress(this.keyPair.publicKey, hrp)
    this.address = address
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

  getChain (): Blockchain {
    return this.chain
  }

  sign (buffer: JuneoBuffer): JuneoBuffer {
    return this.keyPair.sign(buffer)
  }

  static encodeJuneoAddress (publicKey: string, hrp: string): string {
    return encoding.encodeBech32(hrp, rmd160(sha256(publicKey)))
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

  constructor (privateKey: string, hrp: string, chain: Blockchain) {
    super(privateKey, hrp, chain)
    this.evmWallet = new Wallet(this.privateKey)
    this.address = this.evmWallet.address
  }
}
