import { ethers } from 'ethers'
import { ChainError, isHex, validateBech32 } from '../utils'
import { type MCNProvider } from '../juneo'
import { AssetId } from '../transaction'
import { JEVMExportTransaction, JEVMImportTransaction } from '../transaction/jevm'
import { type JEVMAPI } from '../api/jevm'
import { type GetAssetDescriptionResponse } from '../api/jvm/data'
import { type ContractAdapter, ContractHandler, ERC20ContractAdapter } from '../solidity'
import { type TokenAsset, type JRC20Asset, type JEVMGasToken, type JNTAsset } from './asset'

export const PLATFORMVM_ID: string = '11111111111111111111111111111111LpoYY'
export const JVM_ID: string = 'otSmSxFRBqdRX7kestRW732n3WS2MrLAoWwHZxHnmMGMuLYX8'
export const JEVM_ID: string = 'orkbbNQVf27TiBe6GqN5dm8d8Lo3rutEov8DUWZaKNUjckwSk'
export const EVM_ID: string = 'mgj786NP7uDwBCcq6YwThhaN8FLyybkCa4zBWTQbNgmK6k9A6'

export interface Blockchain {
  name: string
  id: string
  vmId: string
  asset: TokenAsset
  assetId: string
  aliases: string[]
  registeredAssets: TokenAsset[]

  getAsset: (assetId: string) => TokenAsset

  validateAddress: (address: string, hrp?: string) => boolean

  validateAssetId: (provider: MCNProvider, assetId: string) => Promise<boolean>
}

export abstract class AbstractBlockchain implements Blockchain {
  name: string
  id: string
  vmId: string
  asset: TokenAsset
  assetId: string
  aliases: string[]
  registeredAssets: TokenAsset[]

  constructor (name: string, id: string, vmId: string, asset: TokenAsset, aliases: string[] = [], registeredAssets: TokenAsset[] = []) {
    this.name = name
    this.id = id
    this.vmId = vmId
    this.asset = asset
    this.assetId = asset.assetId
    this.aliases = aliases
    this.registeredAssets = registeredAssets
    this.registerAssets([asset])
  }

  registerAssets (assets: TokenAsset[]): void {
    this.registeredAssets.push(...assets)
  }

  getAsset (assetId: string): TokenAsset {
    for (let i = 0; i < this.registeredAssets.length; i++) {
      const asset: TokenAsset = this.registeredAssets[i]
      if (assetId === asset.assetId) {
        return asset
      }
    }
    throw new ChainError(`unregistered asset id: ${assetId}`)
  }

  abstract validateAddress (address: string, hrp?: string): boolean

  abstract validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean>
}

export class PlatformBlockchain extends AbstractBlockchain {
  constructor (name: string, id: string, asset: JNTAsset, aliases?: string[], registeredAssets: TokenAsset[] = []) {
    super(name, id, PLATFORMVM_ID, asset, aliases, registeredAssets)
  }

  validateAddress (address: string, hrp?: string): boolean {
    return validateBech32(address, hrp, this.aliases.concat(this.id))
  }

  async validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean> {
    return await JVMBlockchain.validateJVMAssetId(provider, assetId)
  }
}

export class JVMBlockchain extends AbstractBlockchain {
  constructor (name: string, id: string, asset: JNTAsset, aliases?: string[], registeredAssets: TokenAsset[] = []) {
    super(name, id, JVM_ID, asset, aliases, registeredAssets)
  }

  validateAddress (address: string, hrp?: string): boolean {
    return validateBech32(address, hrp, this.aliases.concat(this.id))
  }

  async validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean> {
    return await JVMBlockchain.validateJVMAssetId(provider, assetId)
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

export class JEVMBlockchain extends AbstractBlockchain {
  static readonly SendEtherGasLimit: bigint = BigInt(21_000)
  static readonly AtomicSignatureCost: bigint = BigInt(1_000)
  static readonly AtomicBaseCost: bigint = BigInt(10_000)
  static readonly AtomicDenomination: bigint = BigInt(1_000_000_000)
  override asset: JEVMGasToken
  chainId: bigint
  baseFee: bigint
  ethProvider: ethers.JsonRpcProvider
  contractHandler: ContractHandler
  jrc20Assets: JRC20Asset[]

  constructor (name: string, id: string, asset: JEVMGasToken, chainId: bigint, baseFee: bigint, nodeAddress: string, aliases?: string[], registeredAssets: TokenAsset[] = [], jrc20Assets: JRC20Asset[] = []) {
    super(name, id, JEVM_ID, asset, aliases, registeredAssets)
    this.asset = asset
    this.chainId = chainId
    this.baseFee = baseFee
    this.ethProvider = new ethers.JsonRpcProvider(`${nodeAddress}/ext/bc/${id}/rpc`)
    this.jrc20Assets = jrc20Assets
    this.contractHandler = new ContractHandler()
    this.contractHandler.registerAdapters([
      new ERC20ContractAdapter(this.ethProvider)
    ])
  }

  /**
   * @deprecated
   */
  async getContractTransactionData (assetId: string, to: string, amount: bigint): Promise<string> {
    const contract: ContractAdapter | null = await this.contractHandler.getAdapter(assetId)
    if (contract === null) {
      return '0x'
    } else {
      return contract.getTransferData(assetId, to, amount)
    }
  }

  validateAddress (address: string): boolean {
    return ethers.isAddress(address)
  }

  /**
   * @deprecated
   */
  async validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean> {
    if (assetId === this.assetId) {
      return true
    }
    if (!JEVMBlockchain.isContractAddress(assetId)) {
      return false
    }
    const contract: ContractAdapter | null = await this.contractHandler.getAdapter(assetId)
    return contract !== null
  }

  async queryEVMBalance (api: JEVMAPI, address: string, assetId: string): Promise<bigint> {
    // native asset
    if (assetId === this.assetId) {
      return await api.eth_getBalance(address, 'pending')
    }
    // jnt asset
    if (AssetId.validate(assetId)) {
      return await api.eth_getAssetBalance(address, 'pending', assetId)
    }
    // from here should only be solidity smart contract
    const contract: ContractAdapter | null = await this.contractHandler.getAdapter(assetId)
    if (contract === null) {
      return BigInt(0)
    } else {
      return await contract.queryBalance(assetId, address)
    }
  }

  private calculateAtomicGas (size: bigint, signaturesCount: bigint): bigint {
    return size + JEVMBlockchain.AtomicSignatureCost * signaturesCount + JEVMBlockchain.AtomicBaseCost
  }

  estimateAtomicExportGas (exportedAssets: string[], importFeeAssetId: string): bigint {
    const signaturesCount: number = JEVMExportTransaction.estimateSignaturesCount(
      exportedAssets, this.assetId, importFeeAssetId
    )
    const size: number = JEVMExportTransaction.estimateSize(signaturesCount)
    return this.calculateAtomicGas(BigInt(size), BigInt(signaturesCount))
  }

  estimateAtomicImportGas (importedAssets: string[]): bigint {
    const mergedInputs: boolean = false
    const signaturesCount: number = JEVMImportTransaction.estimateSignaturesCount(
      importedAssets, this.assetId, mergedInputs
    )
    const size: number = JEVMImportTransaction.estimateSize(signaturesCount, mergedInputs)
    return this.calculateAtomicGas(BigInt(size), BigInt(signaturesCount))
  }

  calculateAtomicCost (gas: bigint, baseFee: bigint): bigint {
    return gas * baseFee / JEVMBlockchain.AtomicDenomination
  }

  static isContractAddress (assetId: string): boolean {
    // ethers.isAddress supports also ICAP addresses so check if it is hex too
    return isHex(assetId) && ethers.isAddress(assetId)
  }
}
