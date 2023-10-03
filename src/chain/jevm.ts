import { ethers } from 'ethers'
import { ChainError, isHex } from '../utils'
import { AssetId } from '../transaction'
import { type JEVMAPI } from '../api'
import { type ContractAdapter, ContractHandler, ERC20ContractAdapter } from './solidity'
import { type TokenAsset, type JRC20Asset, type JEVMGasToken } from '../asset'
import { AbstractBlockchain } from './chain'
import { type MCNProvider } from '../juneo'

export const JEVM_ID: string = 'orkbbNQVf27TiBe6GqN5dm8d8Lo3rutEov8DUWZaKNUjckwSk'
export const EVM_ID: string = 'mgj786NP7uDwBCcq6YwThhaN8FLyybkCa4zBWTQbNgmK6k9A6'

export const NativeAssetBalanceContract: string = '0x0100000000000000000000000000000000000001'
export const NativeAssetCallContract: string = '0x0100000000000000000000000000000000000002'

export class JEVMBlockchain extends AbstractBlockchain {
  static readonly SendEtherGasLimit: bigint = BigInt(21_000)
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

  protected async fetchAsset (provider: MCNProvider, assetId: string): Promise<TokenAsset> {
    throw new Error('not implemented')
  }

  validateAddress (address: string): boolean {
    return ethers.isAddress(address)
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
    if (!JEVMBlockchain.isContractAddress(assetId)) {
      throw new ChainError(`cannot query balance of invalid asset id ${assetId}`)
    }
    // from here should only be solidity smart contract
    const contract: ContractAdapter | null = await this.contractHandler.getAdapter(assetId)
    if (contract === null) {
      return BigInt(0)
    } else {
      return await contract.queryBalance(assetId, address)
    }
  }

  static isContractAddress (assetId: string): boolean {
    // ethers.isAddress supports also ICAP addresses so check if it is hex too
    return isHex(assetId) && ethers.isAddress(assetId)
  }
}
