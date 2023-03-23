import { Wallet } from 'ethers'
import { Buffer } from 'buffer'
import { type Blockchain } from '../chain'
import { ECKeyPair, WalletError } from '../utils'
import * as encoding from '../utils/encoding'
import * as bip39 from 'bip39'
import hash from 'create-hash'
import hdKey from 'hdkey'

const EVM_HD_PATH = "m/44'/60'/0'/0/0"
const JVM_HD_PATH = "m/44'/9000'/0'/0/0"

const JVM_PRIVATE_KEY_PREFIX = 'PrivateKey-'
const DEFAULT_HRP = 'june'

export function validatePrivateKey (data: string): boolean {
  if (encoding.isHex(data)) {
    return true
  }
  if (data.includes(JVM_PRIVATE_KEY_PREFIX)) {
    const split: string[] = data.split('-')
    return split.length > 1 && encoding.isBase58(split[1])
  }
  return false
}

export function encodeJuneoAddress (publicKey: string, hrp: string): string {
  const sha256: Buffer = Buffer.from(hash('sha256').update(Buffer.from(publicKey, 'hex')).digest())
  const rmd160: Buffer = Buffer.from(hash('ripemd160').update(sha256).digest())
  return encoding.encodeBech32(hrp, rmd160)
}

export class JuneoWallet {
  hrp: string
  mnemonic: string | undefined
  private hdNode: hdKey | undefined
  privateKey: string | undefined
  chainsWallets: Wallets = {}

  private constructor (hrp?: string) {
    this.hrp = hrp === undefined ? DEFAULT_HRP : hrp
  }

  getAddress (chain: Blockchain): string {
    if (this.chainsWallets[chain.id] === undefined) {
      this.setChainWallet(chain, chain.buildWallet(this))
    }
    return this.getWallet(chain).getAddress()
  }

  getWallet (chain: Blockchain): VMWallet {
    if (this.chainsWallets[chain.id] === undefined) {
      this.setChainWallet(chain, chain.buildWallet(this))
    }
    return this.chainsWallets[chain.id]
  }

  private setChainWallet (chain: Blockchain, wallet: VMWallet): void {
    this.chainsWallets[chain.id] = wallet
  }

  buildJVMWallet (chain: Blockchain): JVMWallet {
    let wallet: JVMWallet | undefined
    if (this.hdNode !== undefined) {
      const privateKey = this.hdNode.derive(JVM_HD_PATH).privateKey.toString('hex')
      wallet = new JVMWallet(privateKey, this.hrp, chain)
    } else if (this.privateKey !== undefined) {
      wallet = new JVMWallet(this.privateKey, this.hrp, chain)
    }
    if (wallet === undefined) {
      throw new WalletError('missing recovery data to build wallet')
    }
    return wallet
  }

  buildJEVMWallet (chain: Blockchain): JEVMWallet {
    let wallet: JEVMWallet | undefined
    if (this.hdNode !== undefined) {
      const privateKey = this.hdNode.derive(EVM_HD_PATH).privateKey.toString('hex')
      wallet = new JEVMWallet(privateKey, this.hrp, chain)
    } else if (this.privateKey !== undefined) {
      wallet = new JEVMWallet(this.privateKey, this.hrp, chain)
    }
    if (wallet === undefined) {
      throw new WalletError('missing recovery data to build wallet')
    }
    return wallet
  }

  setMnemonic (mnemonic: string): void {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new WalletError('invalid mnemonic provided')
    }
    this.mnemonic = mnemonic
    const seed: string = bip39.mnemonicToSeedSync(mnemonic).toString('hex')
    this.hdNode = hdKey.fromMasterSeed(Buffer.from(seed, 'hex'))
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
        privateKey = encoding.hasHexPrefix(privateKey) ? privateKey.substring(2, privateKey.length) : privateKey
      } else {
        privateKey = encoding.decodeCB58(privateKey.split('-')[1]).toString('hex')
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

export type Wallets = Record<string, VMWallet>

export interface VMWallet {

  getAddress: () => string

  sign: (buffer: Buffer) => Buffer

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
    if (this.chain.aliases !== undefined && this.chain.aliases.length > 0) {
      return `${this.chain.aliases[0]}-${this.address}`
    }
    return `${this.chain.id}-${this.address}`
  }

  sign (buffer: Buffer): Buffer {
    return this.keyPair.sign(buffer)
  }
}

export class JVMWallet extends AbstractVMWallet {
  jvmPrivateKey: string

  constructor (privateKey: string, hrp: string, chain: Blockchain) {
    super(privateKey, hrp, chain)
    const jvmKey: string = encoding.encodeCB58(Buffer.from(privateKey, 'hex'))
    this.jvmPrivateKey = `${JVM_PRIVATE_KEY_PREFIX}${jvmKey}`
  }
}

export class JEVMWallet extends AbstractVMWallet {
  private readonly evmWallet: Wallet
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
