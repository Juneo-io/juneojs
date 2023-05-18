import { Wallet } from 'ethers'
import { JEVM_ID, type Blockchain, JVM_ID, PLATFORMVM_ID } from '../chain'
import { ECKeyPair, JuneoBuffer, rmd160, sha256, WalletError } from '../utils'
import * as encoding from '../utils/encoding'
import * as bip39 from 'bip39'
import hdKey from 'hdkey'

const EvmHdPath = "m/44'/60'/0'/0/0"
const JvmHdPath = "m/44'/9000'/0'/0/0"

const JvmPrivateKeyPrefix = 'PrivateKey-'
const PrivateKeyLength: number = 64
const DefaultHrp = 'june'

export function validatePrivateKey (data: string): boolean {
  if (encoding.isHex(data)) {
    const hasPrefix: boolean = encoding.hasHexPrefix(data)
    const length = hasPrefix ? data.substring(2).length : data.length
    return length === PrivateKeyLength
  }
  if (data.includes(JvmPrivateKeyPrefix)) {
    const split: string[] = data.split('-')
    const isBase58: boolean = split.length > 1 && encoding.isBase58(split[1])
    return isBase58 && encoding.decodeCB58(split[1]).length === PrivateKeyLength
  }
  return false
}

export function encodeJuneoAddress (publicKey: string, hrp: string): string {
  return encoding.encodeBech32(hrp, rmd160(sha256(publicKey)))
}

export class JuneoWallet {
  hrp: string
  mnemonic: string | undefined
  private hdNode: hdKey | undefined
  privateKey: string | undefined
  chainsWallets: Record<string, VMWallet> = {}

  private constructor (hrp: string = DefaultHrp) {
    this.hrp = hrp
  }

  getAddress (chain: Blockchain): string {
    if (this.chainsWallets[chain.id] === undefined) {
      this.setChainWallet(chain)
    }
    return this.getWallet(chain).getAddress()
  }

  getWallet (chain: Blockchain): VMWallet {
    if (this.chainsWallets[chain.id] === undefined) {
      this.setChainWallet(chain)
    }
    return this.chainsWallets[chain.id]
  }

  getWallets (): VMWallet[] {
    const wallets: VMWallet[] = []
    for (const key in this.chainsWallets) {
      wallets.push(this.chainsWallets[key])
    }
    return wallets
  }

  private setChainWallet (chain: Blockchain): void {
    if (chain.vmId === JEVM_ID) {
      this.chainsWallets[chain.id] = this.buildJEVMWallet(chain)
    } else if (chain.vmId === JVM_ID) {
      this.chainsWallets[chain.id] = this.buildJVMWallet(chain)
    } else if (chain.vmId === PLATFORMVM_ID) {
      this.chainsWallets[chain.id] = this.buildJVMWallet(chain)
    } else {
      throw new WalletError('unsupported vm id')
    }
  }

  private buildJVMWallet (chain: Blockchain): JVMWallet {
    let wallet: JVMWallet | undefined
    // affecation after declaration to prevent linter to remove value
    wallet = undefined
    if (this.hdNode !== undefined) {
      const privateKey = this.hdNode.derive(JvmHdPath).privateKey.toString('hex')
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
    // affecation after declaration to prevent linter to remove value
    wallet = undefined
    if (this.hdNode !== undefined) {
      const privateKey = this.hdNode.derive(EvmHdPath).privateKey.toString('hex')
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

  static recover (data: string, hrp?: string): JuneoWallet {
    if (bip39.validateMnemonic(data)) {
      const wallet: JuneoWallet = new JuneoWallet(hrp)
      wallet.setMnemonic(data)
      return wallet
    }
    if (validatePrivateKey(data)) {
      const wallet: JuneoWallet = new JuneoWallet(hrp)
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

  static generate (hrp?: string): JuneoWallet {
    const mnemonic = bip39.generateMnemonic()
    const wallet = JuneoWallet.recover(mnemonic, hrp)
    return wallet
  }
}

export interface VMWallet {

  getAddress: () => string

  getChain: () => Blockchain

  sign: (buffer: JuneoBuffer) => JuneoBuffer

}

export abstract class AbstractVMWallet implements VMWallet {
  privateKey: string
  private readonly keyPair: ECKeyPair
  hrp: string
  chain: Blockchain
  address: string

  constructor (privateKey: string, hrp: string, chain: Blockchain) {
    this.privateKey = privateKey
    this.keyPair = new ECKeyPair(privateKey)
    this.hrp = hrp
    this.chain = chain
    this.address = encodeJuneoAddress(this.keyPair.getPublicKey(), hrp)
  }

  getAddress (): string {
    if (this.chain.aliases.length > 0) {
      return `${this.chain.aliases[0]}-${this.address}`
    }
    return `${this.chain.id}-${this.address}`
  }

  getChain (): Blockchain {
    return this.chain
  }

  sign (buffer: JuneoBuffer): JuneoBuffer {
    return this.keyPair.sign(buffer)
  }
}

export class JVMWallet extends AbstractVMWallet {
  jvmPrivateKey: string

  constructor (privateKey: string, hrp: string, chain: Blockchain) {
    super(privateKey, hrp, chain)
    const jvmKey: string = encoding.encodeCB58(JuneoBuffer.fromString(privateKey, 'hex'))
    this.jvmPrivateKey = `${JvmPrivateKeyPrefix}${jvmKey}`
  }
}

export class JEVMWallet extends AbstractVMWallet {
  evmWallet: Wallet
  evmAddress: string

  constructor (privateKey: string, hrp: string, chain: Blockchain) {
    super(privateKey, hrp, chain)
    this.evmWallet = new Wallet(this.privateKey)
    this.evmAddress = this.evmWallet.address
  }

  getHexAddress (): string {
    return this.evmAddress
  }
}
