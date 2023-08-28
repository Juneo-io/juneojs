import { ethers } from 'ethers'
import { ChainError, isHex, validateBech32 } from '../utils'
import { type MCNProvider } from '../juneo'
import { AssetId, type UserInput } from '../transaction'
import { JEVMExportTransaction, JEVMImportTransaction } from '../transaction/jevm'
import { type JEVMAPI } from '../api/jevm'
import { type GetAssetDescriptionResponse } from '../api/jvm/data'
import { type ContractAdapter, ContractHandler, ERC20ContractAdapter } from '../solidity'
import { type TokenAsset, type JRC20Asset } from './asset'

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

  queryBaseFee: (provider: MCNProvider) => Promise<bigint>
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
    this.registeredAssets.forEach(asset => {
      if (assetId === asset.assetId) {
        return asset
      }
    })
    throw new ChainError(`unregistered asset id: ${assetId}`)
  }

  abstract validateAddress (address: string, hrp?: string): boolean

  abstract validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean>

  abstract queryBaseFee (provider: MCNProvider): Promise<bigint>
}

export class PlatformBlockchain extends AbstractBlockchain implements Crossable {
  constructor (name: string, id: string, asset: TokenAsset, aliases?: string[], registeredAssets: TokenAsset[] = []) {
    super(name, id, PLATFORMVM_ID, asset, aliases, registeredAssets)
  }

  validateAddress (address: string, hrp?: string): boolean {
    return validateBech32(address, hrp, this.aliases.concat(this.id))
  }

  async validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean> {
    return await JVMBlockchain.validateJVMAssetId(provider, assetId)
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
  constructor (name: string, id: string, asset: TokenAsset, aliases?: string[], registeredAssets: TokenAsset[] = []) {
    super(name, id, JVM_ID, asset, aliases, registeredAssets)
  }

  validateAddress (address: string, hrp?: string): boolean {
    return validateBech32(address, hrp, this.aliases.concat(this.id))
  }

  async validateAssetId (provider: MCNProvider, assetId: string): Promise<boolean> {
    return await JVMBlockchain.validateJVMAssetId(provider, assetId)
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

export class JEVMBlockchain extends AbstractBlockchain implements Crossable {
  static readonly SendEtherGasLimit: bigint = BigInt(21000)
  static readonly AtomicSignatureCost: bigint = BigInt(1000)
  static readonly AtomicBaseCost: bigint = BigInt(10_000)
  static readonly AtomicDenomination: bigint = BigInt(1_000_000_000)
  chainId: bigint
  ethProvider: ethers.JsonRpcProvider
  contractHandler: ContractHandler
  jrc20Assets: JRC20Asset[]

  constructor (name: string, id: string, asset: TokenAsset, chainId: bigint, nodeAddress: string, aliases?: string[], registeredAssets: TokenAsset[] = [], jrc20Assets: JRC20Asset[] = []) {
    super(name, id, JEVM_ID, asset, aliases, registeredAssets)
    this.chainId = chainId
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
  async estimateGasLimit (assetId: string, from: string, to: string, amount: bigint): Promise<bigint> {
    if (assetId === this.assetId) {
      return JEVMBlockchain.SendEtherGasLimit
    }
    const contract: ContractAdapter | null = await this.contractHandler.getAdapter(assetId)
    if (contract === null) {
      return BigInt(0)
    } else {
      const data: string = contract.getTransferData(assetId, to, amount)
      return await this.ethProvider.estimateGas({
        from,
        to: assetId,
        value: BigInt(0),
        data
      })
    }
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

  async queryBaseFee (provider: MCNProvider): Promise<bigint> {
    return await provider.jevm[this.id].eth_baseFee()
  }

  async queryExportFee (provider: MCNProvider, userInputs: UserInput[], importFeeAssetId: string): Promise<bigint> {
    const signaturesCount: number = JEVMExportTransaction.estimateSignaturesCount(
      userInputs, this.assetId, importFeeAssetId
    )
    const size: number = JEVMExportTransaction.estimateSize(signaturesCount)
    return await this.calculateAtomicCost(provider, BigInt(size), BigInt(signaturesCount))
  }

  async queryImportFee (provider: MCNProvider, userInputs: UserInput[]): Promise<bigint> {
    const mergedInputs: boolean = false
    const signaturesCount: number = JEVMImportTransaction.estimateSignaturesCount(
      userInputs, this.assetId, mergedInputs
    )
    const size: number = JEVMImportTransaction.estimateSize(signaturesCount, mergedInputs)
    return await this.calculateAtomicCost(provider, BigInt(size), BigInt(signaturesCount))
  }

  private async calculateAtomicCost (provider: MCNProvider, size: bigint, signaturesCount: bigint): Promise<bigint> {
    const gasUsed: bigint = size + JEVMBlockchain.AtomicSignatureCost * signaturesCount + JEVMBlockchain.AtomicBaseCost
    const baseFee: bigint = await this.queryBaseFee(provider)
    return gasUsed * baseFee / JEVMBlockchain.AtomicDenomination
  }

  canPayImportFee (): boolean {
    return false
  }

  static isContractAddress (assetId: string): boolean {
    // ethers.isAddress supports also ICAP addresses so check if it is hex too
    return isHex(assetId) && ethers.isAddress(assetId)
  }
}
