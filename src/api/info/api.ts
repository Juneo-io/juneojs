import { AbstractAPI } from '../api'
import { JsonRpcRequest, type JsonRpcResponse, type JuneoClient } from '../client'
import { CachedResponse } from '../data'
import {
  type GetBlockchainIDResponse,
  type GetNetworkIDResponse,
  type GetNetworkNameResponse,
  type GetNodeIDResponse,
  type GetNodeIPResponse,
  type GetNodeVersionResponse,
  type GetTxFeeResponse,
  type GetVMsResponse,
  type IsBootstrappedResponse,
  type PeersResponse,
  type UptimeResponse
} from './data'

const Service: string = 'info'
const Endpoint = '/ext/info'

/**
 * The InfoAPI provides information about the network and/or a specific node connected to it.
 * The specific node related informations is unique, another InfoAPI should be used if such data must be retrieved from a different one.
 * The node which is used for this API depends on the client that is used to instantiate this API.
 */
export class InfoAPI extends AbstractAPI {
  private readonly feesCache = new CachedResponse<GetTxFeeResponse>()

  /**
   * Creates a new InfoAPI with its corresponding info service and endpoint.
   * @param client The client to use to send network requests for this API.
   */
  constructor (client: JuneoClient) {
    super(client, Endpoint, Service)
  }

  /**
   * Checks if a chain is done bootstrapping on the node.
   * @param chain The id or alias of an existing chain.
   * @returns Promise of IsBootstrappedResponse.
   */
  async isBootstrapped (chain: string): Promise<IsBootstrappedResponse> {
    const response: JsonRpcResponse = await this.call('isBootstrapped', [{ chain }])
    return response.result
  }

  /**
   * Fetches the id of the chain corresponding to an alias on the node.
   * Each node can have different aliases defined.
   * @param alias The alias of the chain id to retrieve.
   * @returns Promise of GetBlockchainIDResponse.
   */
  async getBlockchainID (alias: string): Promise<GetBlockchainIDResponse> {
    const response: JsonRpcResponse = await this.call('getBlockchainID', [{ alias }])
    return response.result
  }

  /**
   * Gets the id of the network this node is connected to.
   * @returns Promise of GetNetworkIDResponse.
   */
  async getNetworkID (): Promise<GetNetworkIDResponse> {
    const response: JsonRpcResponse = await this.call('getNetworkID')
    return response.result
  }

  /**
   * Gets the name of the network this node is connected to.
   * @returns Promise of GetNetworkNameResponse.
   */
  async getNetworkName (): Promise<GetNetworkNameResponse> {
    const response: JsonRpcResponse = await this.call('getNetworkName')
    return response.result
  }

  /**
   * Gets the id data of the node.
   * @returns Promise of GetNodeIDResponse.
   */
  async getNodeID (): Promise<GetNodeIDResponse> {
    const response: JsonRpcResponse = await this.call('getNodeID')
    return response.result
  }

  /**
   * Gets the ip of the node.
   * @returns Promise of GetNodeIPResponse.
   */
  async getNodeIP (): Promise<GetNodeIPResponse> {
    const response: JsonRpcResponse = await this.call('getNodeIP')
    return response.result
  }

  /**
   * Gets the informations related to the version of the node.
   * @returns Promise of GetNodeVersionResponse.
   */
  async getNodeVersion (): Promise<GetNodeVersionResponse> {
    const response: JsonRpcResponse = await this.call('getNodeVersion')
    return response.result
  }

  /**
   * Gets the values of the fee from different transactions types of the network this node is connected to.
   * @param forceUpdate **Optional**. Force the retrieval of the value from the node and update the fee cache.
   * @returns Promise of GetTxFeeResponse.
   */
  async getTxFee (forceUpdate: boolean = false): Promise<GetTxFeeResponse> {
    return await this.feesCache.rpcCall(
      this.client,
      Endpoint,
      new JsonRpcRequest(`${Service}.getTxFee`, []),
      forceUpdate
    )
  }

  /**
   * Gets the VMs that are installed on the node.
   * @returns Promise of GetVMsResponse.
   */
  async getVMs (): Promise<GetVMsResponse> {
    const response: JsonRpcResponse = await this.call('getVMs')
    return response.result
  }

  /**
   * Fetches the number of peers connected to the node and a description of them.
   * @param nodeIDs **Optional**. A list of the nodeIDs that should return a description of them.
   * If not used, all peers connected to the node will provide a description.
   * @returns Promise of PeersResponse.
   */
  async peers (nodeIDs?: string[]): Promise<PeersResponse> {
    const response: JsonRpcResponse = await this.call('peers', [{ nodeIDs }])
    return response.result
  }

  /**
   * Checks the uptime of the node on a supernet.
   * @param supernetID **Optional**. The supernet id to check the uptime of.
   * If not used, it will use the primary supernet id.
   * @returns Promise of UptimeResponse.
   */
  async uptime (supernetID?: string): Promise<UptimeResponse> {
    const response: JsonRpcResponse = await this.call('uptime', [{ supernetID }])
    return response.result
  }
}
