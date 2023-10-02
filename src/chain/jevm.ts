import { ethers } from 'ethers'
import { isHex } from '../utils'
import { AssetId, JEVMExportTransaction, JEVMImportTransaction } from '../transaction'
import { type JEVMAPI } from '../api'
import { type ContractAdapter, ContractHandler, ERC20ContractAdapter } from '../solidity'
import { type TokenAsset, type JRC20Asset, type JEVMGasToken } from '../asset'
import { type MCNProvider } from '../juneo'
import { AbstractBlockchain } from './chain'

export const JEVM_ID: string = 'orkbbNQVf27TiBe6GqN5dm8d8Lo3rutEov8DUWZaKNUjckwSk'
export const EVM_ID: string = 'mgj786NP7uDwBCcq6YwThhaN8FLyybkCa4zBWTQbNgmK6k9A6'

export const NativeAssetBalanceContract: string = '0x0100000000000000000000000000000000000001'
export const NativeAssetCallContract: string = '0x0100000000000000000000000000000000000002'

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

  constructor (
    name: string,
    id: string,
    asset: JEVMGasToken,
    chainId: bigint,
    baseFee: bigint,
    nodeAddress: string,
    aliases?: string[],
    registeredAssets: TokenAsset[] = [],
    jrc20Assets: JRC20Asset[] = []
  ) {
    super(name, id, JEVM_ID, asset, aliases, registeredAssets)
    this.asset = asset
    this.chainId = chainId
    this.baseFee = baseFee
    this.ethProvider = new ethers.JsonRpcProvider(`${nodeAddress}/ext/bc/${id}/rpc`)
    this.jrc20Assets = jrc20Assets
    this.contractHandler = new ContractHandler()
    this.contractHandler.registerAdapters([new ERC20ContractAdapter(this.ethProvider)])
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
      exportedAssets,
      this.assetId,
      importFeeAssetId
    )
    const size: number = JEVMExportTransaction.estimateSize(signaturesCount)
    return this.calculateAtomicGas(BigInt(size), BigInt(signaturesCount))
  }

  estimateAtomicImportGas (inputsCount: number, outputsCount: number): bigint {
    const size: number = JEVMImportTransaction.estimateSize(inputsCount, outputsCount)
    return this.calculateAtomicGas(BigInt(size), BigInt(inputsCount))
  }

  calculateAtomicCost (gas: bigint, baseFee: bigint): bigint {
    return (gas * baseFee) / JEVMBlockchain.AtomicDenomination
  }

  static isContractAddress (assetId: string): boolean {
    // ethers.isAddress supports also ICAP addresses so check if it is hex too
    return isHex(assetId) && ethers.isAddress(assetId)
  }
}
