import { ethers } from 'ethers'
import { ChainError, fetchJNT, isContractAddress } from '../utils'
import { AssetId } from '../transaction'
import { type JEVMAPI } from '../api'
import { ERC20ContractHandler, ContractManager, type ContractHandler } from './solidity'
import { type TokenAsset, type JRC20Asset, type JEVMGasToken, TokenType } from '../asset'
import { AbstractBlockchain } from './chain'
import { type MCNProvider } from '../juneo'

export const JEVM_ID: string = 'orkbbNQVf27TiBe6GqN5dm8d8Lo3rutEov8DUWZaKNUjckwSk'
export const EVM_ID: string = 'mgj786NP7uDwBCcq6YwThhaN8FLyybkCa4zBWTQbNgmK6k9A6'

export const NativeAssetBalanceContract: string = '0x0100000000000000000000000000000000000001'
export const NativeAssetCallContract: string = '0x0100000000000000000000000000000000000002'

export const SendEtherGasLimit: bigint = BigInt(21_000)

export class JEVMBlockchain extends AbstractBlockchain {
  override asset: JEVMGasToken
  chainId: bigint
  baseFee: bigint
  ethProvider: ethers.JsonRpcProvider
  jrc20Assets: JRC20Asset[]
  private readonly erc20Handler: ERC20ContractHandler
  private readonly contractManager: ContractManager = new ContractManager()

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
    this.erc20Handler = new ERC20ContractHandler(this.ethProvider)
    this.contractManager.registerHandler(this.erc20Handler)
  }

  async getContractTransactionData (
    provider: MCNProvider,
    assetId: string,
    to: string,
    amount: bigint
  ): Promise<string> {
    // could rather use contract manager but it would require one extra network call
    // we avoid it if the asset is already registered
    const asset: TokenAsset = await this.getAsset(provider, assetId)
    const erc20Types: string[] = [TokenType.ERC20, TokenType.JRC20, TokenType.Wrapped]
    if (erc20Types.includes(asset.type)) {
      return this.erc20Handler.getTransferData(assetId, to, amount)
    }
    return '0x'
  }

  protected async fetchAsset (provider: MCNProvider, assetId: string): Promise<TokenAsset> {
    if (isContractAddress(assetId)) {
      const handler: ContractHandler | null = await this.contractManager.getHandler(assetId)
      if (handler === null) {
        throw new ChainError(`contract address ${assetId} does not implement a compatible interface`)
      }
      return await handler.queryTokenData(assetId)
    }
    return await fetchJNT(provider, assetId)
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
    // from here should only be solidity smart contract
    if (!isContractAddress(assetId)) {
      throw new ChainError(`cannot query balance of invalid asset id ${assetId}`)
    }
    const handler: ContractHandler | null = await this.contractManager.getHandler(assetId)
    if (handler !== null) {
      return await handler.queryBalance(assetId, address)
    }
    return BigInt(0)
  }
}
