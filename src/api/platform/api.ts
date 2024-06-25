import { type PlatformBlockchain } from '../../chain'
import { AbstractUtxoAPI } from '../api'
import { type JsonRpcResponse, type JuneoClient } from '../client'
import { type GetBlockResponse, type GetHeightResponse, type GetTxStatusResponse } from '../data'
import {
  type GetBlockchainsResponse,
  type GetBlockchainStatusResponse,
  type GetCurrentSupplyResponse,
  type GetCurrentValidatorsResponse,
  type GetMinStakeResponse,
  type GetRewardPoolSupplyResponse,
  type GetStakingAssetIDResponse,
  type GetSupernetsResponse,
  type GetTimestampResponse,
  type GetTotalStakeResponse,
  type GetValidatorsAtResponse,
  type SampleValidatorsResponse,
  type ValidatedByResponse,
  type ValidatesResponse
} from './data'

const Service: string = 'platform'

export class PlatformAPI extends AbstractUtxoAPI {
  chain: PlatformBlockchain

  constructor (client: JuneoClient, chain: PlatformBlockchain) {
    super(client, `/ext/bc/${chain.id}`, Service)
    this.chain = chain
  }

  async getBlock (blockID: string, encoding?: string): Promise<GetBlockResponse> {
    const response: JsonRpcResponse = await this.call('getBlock', [{ blockID, encoding }])
    return response.result
  }

  async getBlockByHeight (height: number, encoding?: string): Promise<GetBlockResponse> {
    const response: JsonRpcResponse = await this.call('getBlockByHeight', [{ height, encoding }])
    return response.result
  }

  /**
   * @deprecated
   */
  async getBlockchains (): Promise<GetBlockchainsResponse> {
    const response: JsonRpcResponse = await this.call('getBlockchains')
    return response.result
  }

  async getBlockchainStatus (blockchainID: string): Promise<GetBlockchainStatusResponse> {
    const response: JsonRpcResponse = await this.call('getBlockchainStatus', [{ blockchainID }])
    return response.result
  }

  async getCurrentSupply (supernetID?: string): Promise<GetCurrentSupplyResponse> {
    const response: JsonRpcResponse = await this.call('getCurrentSupply', [{ supernetID }])
    return response.result
  }

  async getRewardPoolSupply (supernetID?: string): Promise<GetRewardPoolSupplyResponse> {
    const response: JsonRpcResponse = await this.call('getRewardPoolSupply', [{ supernetID }])
    return response.result
  }

  async getCurrentValidators (supernetID?: string, nodeIDs?: string[]): Promise<GetCurrentValidatorsResponse> {
    const response: JsonRpcResponse = await this.call('getCurrentValidators', [{ supernetID, nodeIDs }])
    return response.result
  }

  async getHeight (): Promise<GetHeightResponse> {
    const response: JsonRpcResponse = await this.call('getHeight')
    return response.result
  }

  async getMinStake (supernetID?: string): Promise<GetMinStakeResponse> {
    const response: JsonRpcResponse = await this.call('getMinStake', [{ supernetID }])
    return response.result
  }

  async getStakingAssetID (supernetID?: string): Promise<GetStakingAssetIDResponse> {
    const response: JsonRpcResponse = await this.call('getStakingAssetID', [{ supernetID }])
    return response.result
  }

  /**
   * @deprecated
   * // TODO must be replace with getSupernet
   */
  async getSupernets (ids: string[]): Promise<GetSupernetsResponse> {
    const response: JsonRpcResponse = await this.call('getSupernets', [{ ids }])
    return response.result
  }

  async getTimestamp (): Promise<GetTimestampResponse> {
    const response: JsonRpcResponse = await this.call('getTimestamp')
    return response.result
  }

  async getTotalStake (supernetID: string): Promise<GetTotalStakeResponse> {
    const response: JsonRpcResponse = await this.call('getTotalStake', [{ supernetID }])
    return response.result
  }

  async getTxStatus (txID: string): Promise<GetTxStatusResponse> {
    const response: JsonRpcResponse = await this.call('getTxStatus', [{ txID }])
    return response.result
  }

  async getValidatorsAt (height: number, supernetID?: string): Promise<GetValidatorsAtResponse> {
    const response: JsonRpcResponse = await this.call('getValidatorsAt', [{ height, supernetID }])
    return response.result
  }

  async sampleValidators (size: number, supernetID?: string): Promise<SampleValidatorsResponse> {
    const response: JsonRpcResponse = await this.call('sampleValidators', [{ size, supernetID }])
    return response.result
  }

  async validatedBy (blockchainID: string): Promise<ValidatedByResponse> {
    const response: JsonRpcResponse = await this.call('validatedBy', [{ blockchainID }])
    return response.result
  }

  async validates (supernetID: string): Promise<ValidatesResponse> {
    const response: JsonRpcResponse = await this.call('validates', [{ supernetID }])
    return response.result
  }
}
