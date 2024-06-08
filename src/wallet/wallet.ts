import { HDNodeWallet, Mnemonic, randomBytes, Wallet } from 'ethers'
import { JEVM_ID, JVM_ID, PLATFORMVM_ID, type Blockchain, type JEVMBlockchain } from '../chain'
import { MainNetwork } from '../network'
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

  private constructor (hrp: string = MainNetwork.hrp) {
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

  private setChainWallet (chain: Blockchain): void {
    const privateKey = this.getVMWalletPrivateKey(chain)
    if (chain.vm.id === JEVM_ID) {
      this.chainsWallets.set(chain.id, new JEVMWallet(privateKey, this.hrp, chain))
    } else if (chain.vm.id === JVM_ID) {
      this.chainsWallets.set(chain.id, new JVMWallet(privateKey, this.hrp, chain))
    } else if (chain.vm.id === PLATFORMVM_ID) {
      this.chainsWallets.set(chain.id, new JVMWallet(privateKey, this.hrp, chain))
    } else {
      throw new WalletError(`unsupported vm id: ${chain.vm.id}`)
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

  static recover (data: string, hrp?: string): MCNWallet {
    if (Mnemonic.isValidMnemonic(data)) {
      const wallet: MCNWallet = new MCNWallet(hrp)
      wallet.setMnemonic(data)
      return wallet
    }
    if (validatePrivateKey(data)) {
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
    const mnemonic = Mnemonic.fromEntropy(randomBytes(strength / 8)).phrase
    const wallet = MCNWallet.recover(mnemonic, hrp)
    return wallet
  }
}

export interface VMWallet {
  getAddress: () => string

  getJuneoAddress: () => string

  getKeyPair: () => ECKeyPair

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
    this.juneoAddress = encodeJuneoAddress(this.keyPair.publicKey, hrp)
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

  getKeyPair (): ECKeyPair {
    return this.keyPair
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
    this.jvmPrivateKey = `${JVMPrivateKeyPrefix}${jvmKey}`
  }
}

export class JEVMWallet extends AbstractVMWallet {
  evmWallet: Wallet
  nonce: bigint = BigInt(0)
  synchronized: boolean = false

  constructor (privateKey: string, hrp: string, chain: Blockchain) {
    super(privateKey, hrp, chain)
    this.evmWallet = new Wallet(this.privateKey)
    this.address = this.evmWallet.address
  }
}
