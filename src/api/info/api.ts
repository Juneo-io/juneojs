import { AbstractAPI } from '../api'
import { type JsonRpcResponse, type JuneoClient } from '../client'
import { type GetBlockchainIDResponse, type GetNetworkIDResponse, type GetNetworkNameResponse, type GetNodeIDResponse, type GetNodeIPResponse, type GetNodeVersionResponse, type GetTxFeeResponse, type GetVMsResponse, type IsBootstrappedResponse, type PeersResponse, type UptimeResponse } from './data'

const Service: string = 'info'
const Endpoint = '/info'

export class InfoAPI extends AbstractAPI {
  constructor (client: JuneoClient) {
    super(client, Endpoint, Service)
  }

  async isBootstrapped (chain: string): Promise<IsBootstrappedResponse> {
    const response: JsonRpcResponse = await this.call('isBootstrapped', [{ chain }])
    return response.result
  }

  async getBlockchainID (alias: string): Promise<GetBlockchainIDResponse> {
    const response: JsonRpcResponse = await this.call('getBlockchainID', [{ alias }])
    return response.result
  }

  async getNetworkID (): Promise<GetNetworkIDResponse> {
    const response: JsonRpcResponse = await this.call('getNetworkID')
    return response.result
  }

  async getNetworkName (): Promise<GetNetworkNameResponse> {
    const response: JsonRpcResponse = await this.call('getNetworkName')
    return response.result
  }

  async getNodeID (): Promise<GetNodeIDResponse> {
    const response: JsonRpcResponse = await this.call('getNodeID')
    return response.result
  }

  async getNodeIP (): Promise<GetNodeIPResponse> {
    const response: JsonRpcResponse = await this.call('getNodeIP')
    return response.result
  }

  async getNodeVersion (): Promise<GetNodeVersionResponse> {
    const response: JsonRpcResponse = await this.call('getNodeVersion')
    return response.result
  }

  async getTxFee (): Promise<GetTxFeeResponse> {
    const response: JsonRpcResponse = await this.call('getTxFee')
    return response.result
  }

  async getVMs (): Promise<GetVMsResponse> {
    const response: JsonRpcResponse = await this.call('getVMs')
    return response.result
  }

  async peers (nodeIDs?: string[]): Promise<PeersResponse> {
    const response: JsonRpcResponse = await this.call('peers', [{ nodeIDs }])
    return response.result
  }

  async uptime (supernetID?: string): Promise<UptimeResponse> {
    const response: JsonRpcResponse = await this.call('uptime', [{ supernetID }])
    return response.result
  }
}
