import { isAddress } from 'ethers'
import { validateBech32 } from '../utils'
import { type JuneoWallet, type VMWallet } from '../wallet'
import { type MCNProvider } from '../juneo'
import { type UserInput } from '../transaction'
import { JEVMExportTransaction, JEVMImportTransaction } from '../transaction/jevm'

export const RELAYVM_ID: string = '11111111111111111111111111111111LpoYY'
export const JVM_ID: string = 'otSmSxFRBqdRX7kestRW732n3WS2MrLAoWwHZxHnmMGMuLYX8'
export const JEVM_ID: string = 'mgj786NP7uDwBCcq6YwThhaN8FLyybkCa4zBWTQbNgmK6k9A6'

const RELAY_CHAIN_NAME: string = 'Relay Chain'
const RELAY_CHAIN_ID: string = '11111111111111111111111111111111LpoYY'

export interface Blockchain {

  name: string
  id: string
  vmId: string
  assetId: string
  aliases: string[]

  buildWallet: (wallet: JuneoWallet) => VMWallet

  validateAddress: (address: string) => boolean

  queryBaseFee: (provider: MCNProvider) => Promise<bigint>

}

export interface JEVMBlockchain {

  chainId: bigint

}

export interface Crossable {

  queryExportFee: (provider: MCNProvider, userInputs: UserInput[], importFeeAssetId: string) => Promise<bigint>

  queryImportFee: (provider: MCNProvider, userInputs: UserInput[]) => Promise<bigint>

}

export function isCrossable (object: any): boolean {
  const a: boolean = 'queryExportFee' in object
  const b: boolean = 'queryImportFee' in object
  return a && b
}

export abstract class AbstractBlockchain implements Blockchain {
  name: string
  id: string
  vmId: string
  assetId: string
  aliases: string[]

  constructor (name: string, id: string, vmId: string, assetId: string, aliases?: string[]) {
    this.name = name
    this.id = id
    this.vmId = vmId
    this.assetId = assetId
    this.aliases = aliases === undefined ? [] : aliases
  }

  abstract buildWallet (wallet: JuneoWallet): VMWallet

  abstract validateAddress (address: string): boolean

  abstract queryBaseFee (provider: MCNProvider): Promise<bigint>
}

export class RelayBlockchain extends AbstractBlockchain implements Crossable {
  constructor (assetId: string, aliases?: string[]) {
    super(RELAY_CHAIN_NAME, RELAY_CHAIN_ID, RELAYVM_ID, assetId, aliases)
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJVMWallet(this)
  }

  validateAddress (address: string): boolean {
    return validateBech32(address, this.aliases.length > 0 ? this.aliases[0] : this.id)
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
}

export class JVMBlockchain extends AbstractBlockchain implements Crossable {
  constructor (name: string, id: string, assetId: string, aliases?: string[]) {
    super(name, id, JVM_ID, assetId, aliases)
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJVMWallet(this)
  }

  validateAddress (address: string): boolean {
    return validateBech32(address, this.aliases.length > 0 ? this.aliases[0] : this.id)
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
}

export class JEVMBlockchain extends AbstractBlockchain implements JEVMBlockchain, Crossable {
  chainId: bigint

  constructor (name: string, id: string, assetId: string, chainId: bigint, aliases?: string[]) {
    super(name, id, JEVM_ID, assetId, aliases)
    this.chainId = chainId
  }

  buildWallet (wallet: JuneoWallet): VMWallet {
    return wallet.buildJEVMWallet(this)
  }

  validateAddress (address: string): boolean {
    return isAddress(address)
  }

  async queryBaseFee (provider: MCNProvider): Promise<bigint> {
    return BigInt.asUintN(64, await provider.jevm[this.id].eth_baseFee())
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
}
