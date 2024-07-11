import { ethers } from 'ethers'
import { type JEVMAPI } from '../api'
import { type JEVMGasToken, type JRC20Asset, type TokenAsset, type WrappedAsset } from '../asset'
import { type MCNProvider } from '../juneo'
import { AssetId } from '../transaction'
import { ChainError, fetchJNT, isContractAddress } from '../utils'
import { AbstractBlockchain } from './chain'
import { EmptyCallData, EVM_HD_PATH, EVMTransferables, JEVM_ID } from './constants'
import { ContractManager, ERC20TokenHandler } from './solidity'
import { ChainVM, VMType, VMWalletType } from './vm'

export class JEVMBlockchain extends AbstractBlockchain {
  override asset: JEVMGasToken
  chainId: bigint
  baseFee: bigint
  ethProvider: ethers.JsonRpcProvider
  jrc20Assets: JRC20Asset[]
  wrappedAsset: WrappedAsset | undefined
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
    jrc20Assets: JRC20Asset[] = [],
    wrappedAsset?: WrappedAsset | undefined
  ) {
    super(name, id, new ChainVM(JEVM_ID, VMType.EVM, VMWalletType.Nonce, EVM_HD_PATH), asset, aliases, registeredAssets)
    this.asset = asset
    this.chainId = chainId
    this.baseFee = baseFee
    this.ethProvider = new ethers.JsonRpcProvider(`${nodeAddress}/ext/bc/${id}/rpc`)
    this.jrc20Assets = jrc20Assets
    this.wrappedAsset = wrappedAsset
    if (typeof wrappedAsset !== 'undefined') {
      this.addRegisteredAsset(wrappedAsset)
    }
    this.contractManager.registerHandler(new ERC20TokenHandler(this.ethProvider))
  }

  async getContractTransactionData (
    provider: MCNProvider,
    assetId: string,
    to: string,
    amount: bigint
  ): Promise<string> {
    // could rather use contract manager but it would require one extra network call
    // we avoid it if the asset is already registered
    const asset = await this.getAsset(provider, assetId)
    if (EVMTransferables.includes(asset.type)) {
      return this.contractManager.getTransferData(this.ethProvider, assetId, to, amount)
    }
    return EmptyCallData
  }

  protected async fetchAsset (provider: MCNProvider, assetId: string): Promise<TokenAsset> {
    if (isContractAddress(assetId)) {
      const handler = await this.contractManager.getHandler(assetId)
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

  async queryBalance (api: JEVMAPI, address: string, assetId: string): Promise<bigint> {
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
    return await this.contractManager.balanceOf(this.ethProvider, assetId, address)
  }
}
