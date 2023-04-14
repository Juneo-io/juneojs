import { ethers } from 'ethers'
import { isHex, validateBech32 } from '../utils'
import { type JuneoWallet, type VMWallet } from '../wallet'
import { type MCNProvider } from '../juneo'
import { AssetId, type UserInput } from '../transaction'
import { JEVMExportTransaction, JEVMImportTransaction } from '../transaction/jevm'
import { type JEVMAPI } from '../api/jevm'
import { type GetAssetDescriptionResponse } from '../api/jvm/data'
import { BaseERC20ABI } from '../solidity'

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

  validateAssetId: (provider: MCNProvider, assetId: string) => Promise<boolean>

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

  abstract validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean>

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

  async validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean> {
    return await JVMBlockchain.validateJVMAssetId(provider, assetId)
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

  async validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean> {
    return await JVMBlockchain.validateJVMAssetId(provider, assetId)
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

  static async validateJVMAssetId (provider: MCNProvider, assetId: string): Promise<boolean> {
    // local check of asset id format to avoid network call if possible
    if (!AssetId.validate(assetId)) {
      return false
    }
    try {
      const asset: GetAssetDescriptionResponse = await provider.jvm.getAssetDescription(assetId)
      // if user used an alias that was valid for an asset id
      // it could be different so we have to check the asset id is really this one
      return asset.assetID === assetId
    } catch (error) {
      return false
    }
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

  async validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean> {
    if (assetId === this.assetId) {
      return true
    }
    if (!JEVMBlockchain.isContractAddress(assetId)) {
      return false
    }
    // checking if is ERC20 by calling decimals read only function
    // other main tokens interfaces should not be using decimals
    // IERC165 is not widespread enough to be used by ERC20 tokens
    const contract: ethers.Contract = new ethers.Contract(assetId, BaseERC20ABI, this.ethProvider)
    try {
      await contract.decimals()
    } catch (error) {
      return false
    }
    return true
  }

  async queryBalance (provider: MCNProvider, address: string, assetId: string): Promise<bigint> {
    const api: JEVMAPI = provider.jevm[this.id]
    if (assetId === this.assetId) {
      return await api.eth_getBalance(address, 'latest')
    }
    if (AssetId.validate(assetId)) {
      return await api.eth_getAssetBalance(address, 'latest', assetId)
    }
    // from here can only be solidity smart contract
    // ERC20 and ERC721 have the same balanceOf function signature
    const contract: ethers.Contract = new ethers.Contract(assetId, BaseERC20ABI, this.ethProvider)
    return BigInt.asUintN(256, await contract.balanceOf(address))
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

  static isContractAddress (assetId: string): boolean {
    // ethers.isAddress supports also ICAP addresses so check if it is hex too
    return isHex(assetId) && ethers.isAddress(assetId)
  }
}
