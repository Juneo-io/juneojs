import { ethers } from 'ethers'
import { isHex, validateBech32 } from '../utils'
import { type JuneoWallet, type VMWallet } from '../wallet'
import { type MCNProvider } from '../juneo'
import { AssetId, type UserInput } from '../transaction'
import { JEVMExportTransaction, JEVMImportTransaction } from '../transaction/jevm'
import { type JEVMAPI } from '../api/jevm'

export const RELAYVM_ID: string = '11111111111111111111111111111111LpoYY'
export const JVM_ID: string = 'otSmSxFRBqdRX7kestRW732n3WS2MrLAoWwHZxHnmMGMuLYX8'
export const JEVM_ID: string = 'mgj786NP7uDwBCcq6YwThhaN8FLyybkCa4zBWTQbNgmK6k9A6'

export interface Blockchain {

  name: string
  id: string
  vmId: string
  assetId: string
  aliases: string[]

  buildWallet: (wallet: JuneoWallet) => VMWallet

  validateAddress: (address: string, hrp?: string) => boolean

  validateAssetId: (assetId: string) => boolean

  queryBalance: (provider: MCNProvider, address: string, assetId: string) => Promise<bigint>

  queryBaseFee: (provider: MCNProvider) => Promise<bigint>

}

export interface EVMBlockchain {

  chainId: bigint
  ethProvider: ethers.JsonRpcProvider

  estimateGasLimit: (assetId: string) => bigint

}

export interface Crossable {

  queryExportFee: (provider: MCNProvider, userInputs: UserInput[], importFeeAssetId: string) => Promise<bigint>

  queryImportFee: (provider: MCNProvider, userInputs: UserInput[]) => Promise<bigint>

  canPayImportFee: () => boolean

}

export function isCrossable (object: any): boolean {
  const a: boolean = 'queryExportFee' in object
  const b: boolean = 'queryImportFee' in object
  const c: boolean = 'canPayImportFee' in object
  return a && b && c
}

export abstract class AbstractBlockchain implements Blockchain {
  name: string
  id: string
  vmId: string
  assetId: string
  aliases: string[]

  constructor (name: string, id: string, vmId: string, assetId: string, aliases: string[] = []) {
    this.name = name
    this.id = id
    this.vmId = vmId
    this.assetId = assetId
    this.aliases = aliases
  }

  abstract buildWallet (wallet: JuneoWallet): VMWallet

  abstract validateAddress (address: string, hrp?: string): boolean

  abstract validateAssetId (assetId: string): boolean

  abstract queryBaseFee (provider: MCNProvider): Promise<bigint>

  abstract queryBalance (provider: MCNProvider, address: string, assetId: string): Promise<bigint>
}

export class RelayBlockchain extends AbstractBlockchain implements Crossable {
  constructor (name: string, id: string, assetId: string, aliases?: string[]) {
    super(name, id, RELAYVM_ID, assetId, aliases)
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJVMWallet(this)
  }

  validateAddress (address: string, hrp?: string): boolean {
    return validateBech32(address, hrp, this.aliases.concat(this.id))
  }

  validateAssetId (assetId: string): boolean {
    // TODO add address api check
    return AssetId.validate(assetId)
  }

  async queryBalance (provider: MCNProvider, address: string, assetId: string): Promise<bigint> {
    const balance: number = (await provider.relay.getBalance([address])).balances[assetId]
    return balance === undefined ? BigInt(0) : BigInt(balance)
  }

  async queryBaseFee (provider: MCNProvider): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }

  async queryExportFee (provider: MCNProvider, userInputs?: UserInput[], importFeeAssetId?: string): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }

  async queryImportFee (provider: MCNProvider, userInputs?: UserInput[]): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }

  canPayImportFee (): boolean {
    return true
  }
}

export class JVMBlockchain extends AbstractBlockchain implements Crossable {
  constructor (name: string, id: string, assetId: string, aliases?: string[]) {
    super(name, id, JVM_ID, assetId, aliases)
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJVMWallet(this)
  }

  validateAddress (address: string, hrp?: string): boolean {
    return validateBech32(address, hrp, this.aliases.concat(this.id))
  }

  validateAssetId (assetId: string): boolean {
    // TODO add address api check
    return AssetId.validate(assetId)
  }

  async queryBalance (provider: MCNProvider, address: string, assetId: string): Promise<bigint> {
    return BigInt((await provider.jvm.getBalance(address, assetId)).balance)
  }

  async queryBaseFee (provider: MCNProvider): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }

  async queryExportFee (provider: MCNProvider, userInputs?: UserInput[], importFeeAssetId?: string): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }

  async queryImportFee (provider: MCNProvider, userInputs?: UserInput[]): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }

  canPayImportFee (): boolean {
    return true
  }
}

export class JEVMBlockchain extends AbstractBlockchain implements EVMBlockchain, Crossable {
  static readonly SendEtherGasLimit: bigint = BigInt(21000)
  chainId: bigint
  ethProvider: ethers.JsonRpcProvider

  constructor (name: string, id: string, assetId: string, chainId: bigint, nodeAddress: string, aliases?: string[]) {
    super(name, id, JEVM_ID, assetId, aliases)
    this.chainId = chainId
    this.ethProvider = new ethers.JsonRpcProvider(`${nodeAddress}/ext/bc/${id}/rpc`)
  }

  estimateGasLimit (assetId: string): bigint {
    return JEVMBlockchain.SendEtherGasLimit
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJEVMWallet(this)
  }

  validateAddress (address: string): boolean {
    return ethers.isAddress(address)
  }

  validateAssetId (assetId: string): boolean {
    if (assetId === this.assetId) {
      return true
    }
    // TODO add address api check
    return isHex(assetId)
  }

  async queryBalance (provider: MCNProvider, address: string, assetId: string): Promise<bigint> {
    const api: JEVMAPI = provider.jevm[this.id]
    if (assetId === this.assetId) {
      return await api.eth_getBalance(address, 'latest')
    }
    return await api.eth_getAssetBalance(address, 'latest', assetId)
  }

  async queryBaseFee (provider: MCNProvider): Promise<bigint> {
    return await provider.jevm[this.id].eth_baseFee()
  }

  async queryExportFee (provider: MCNProvider, userInputs: UserInput[], importFeeAssetId: string): Promise<bigint> {
    const signaturesCount: number = JEVMExportTransaction.estimateSignaturesCount(
      userInputs, this.assetId, importFeeAssetId
    )
    const size: number = JEVMExportTransaction.estimateSize(signaturesCount)
    const gasUsed: bigint = BigInt(size) + BigInt(1000 * signaturesCount) + BigInt(10_000)
    const baseFee: bigint = await this.queryBaseFee(provider)
    return gasUsed * baseFee / BigInt(1_000_000_000)
  }

  async queryImportFee (provider: MCNProvider, userInputs: UserInput[]): Promise<bigint> {
    const mergedInputs: boolean = false
    const signaturesCount: number = JEVMImportTransaction.estimateSignaturesCount(
      userInputs, this.assetId, mergedInputs
    )
    const size: number = JEVMImportTransaction.estimateSize(signaturesCount, mergedInputs)
    const gasUsed: bigint = BigInt(size) + BigInt(1000 * signaturesCount) + BigInt(10_000)
    const baseFee: bigint = await this.queryBaseFee(provider)
    return gasUsed * baseFee / BigInt(1_000_000_000)
  }

  canPayImportFee (): boolean {
    return false
  }
}
