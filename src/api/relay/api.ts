import { type RelayBlockchain } from '../../chain'
import { AbstractChainAPI } from '../api'
import { type JsonRpcResponse, type JuneoClient } from '../client'
import { type GetBalanceResponse, type GetBlockchainsResponse, type GetBlockchainStatusResponse, type GetBlockResponse, type GetCurrentSupplyResponse, type GetCurrentValidatorsResponse, type GetHeightResponse, type GetMaxStakeAmountResponse, type GetMinStakeResponse, type GetPendingValidatorsResponse, type GetRewardUTXOsResponse, type GetStakeResponse, type GetStakingAssetIDResponse, type GetSupernetsResponse, type GetTimestampResponse, type GetTotalStakeResponse, type GetTxResponse, type GetTxStatusResponse, type GetUTXOsResponse, type GetValidatorsAtResponse, type IssueTxResponse, type SampleValidatorsResponse, type UTXOIndex, type ValidatedByResponse, type ValidatesResponse } from './data'

const Service: string = 'relay'

export class RelayAPI extends AbstractChainAPI {
  constructor (client: JuneoClient, chain: RelayBlockchain) {
    super(client, Service, chain)
  }

  async getBalance (addresses: string[]): Promise<GetBalanceResponse> {
    const response: JsonRpcResponse = await this.call('getBalance', [{ addresses }])
    return response.result
  }

  async getBlock (blockID: string, encoding?: string): Promise<GetBlockResponse> {
    const response: JsonRpcResponse = await this.call('getBlock', [{ blockID, encoding }])
    return response.result
  }

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

  async getCurrentValidators (supernetID?: string, nodeIDs?: string[]): Promise<GetCurrentValidatorsResponse> {
    const response: JsonRpcResponse = await this.call('getCurrentValidators', [{ supernetID, nodeIDs }])
    return response.result
  }

  async getHeight (): Promise<GetHeightResponse> {
    const response: JsonRpcResponse = await this.call('getHeight')
    return response.result
  }

  async getMaxStakeAmount (supernetID: string, nodeID: string, startTime: number, endTime: number): Promise<GetMaxStakeAmountResponse> {
    const response: JsonRpcResponse = await this.call('getMaxStakeAmount', [{ supernetID, nodeID, startTime, endTime }])
    return response.result
  }

  async getMinStake (supernetID?: string): Promise<GetMinStakeResponse> {
    const response: JsonRpcResponse = await this.call('getMinStake', [{ supernetID }])
    return response.result
  }

  async getPendingValidators (supernetID?: string, nodeIDs?: string[]): Promise<GetPendingValidatorsResponse> {
    const response: JsonRpcResponse = await this.call('getPendingValidators', [{ supernetID, nodeIDs }])
    return response.result
  }

  async getRewardUTXOs (txID: string, encoding?: string): Promise<GetRewardUTXOsResponse> {
    const response: JsonRpcResponse = await this.call('getRewardUTXOs', [{ txID, encoding }])
    return response.result
  }

  async getStake (addresses: string[]): Promise<GetStakeResponse> {
    const response: JsonRpcResponse = await this.call('getStake', [{ addresses }])
    return response.result
  }

  async getStakingAssetID (supernetID?: string): Promise<GetStakingAssetIDResponse> {
    const response: JsonRpcResponse = await this.call('getStakingAssetID', [{ supernetID }])
    return response.result
  }

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

  async getTx (txID: string, encoding?: string): Promise<GetTxResponse> {
    const response: JsonRpcResponse = await this.call('getTx', [{ txID, encoding }])
    return response.result
  }

  async getTxStatus (txID: string): Promise<GetTxStatusResponse> {
    const response: JsonRpcResponse = await this.call('getTxStatus', [{ txID }])
    return response.result
  }

  async getUTXOs (addresses: string[], limit?: number, startIndex?: UTXOIndex, sourceChain?: string, encoding?: string): Promise<GetUTXOsResponse> {
    const response: JsonRpcResponse = await this.call('getUTXOs', [{ addresses, limit, startIndex, sourceChain, encoding }])
    return response.result
  }

  async getValidatorsAt (height: number, supernetID?: string): Promise<GetValidatorsAtResponse> {
    const response: JsonRpcResponse = await this.call('getValidatorsAt', [{ height, supernetID }])
    return response.result
  }

  async issueTx (tx: string, encoding?: string): Promise<IssueTxResponse> {
    const response: JsonRpcResponse = await this.call('issueTx', [{ tx, encoding }])
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
