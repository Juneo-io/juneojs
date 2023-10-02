import { JsonRpcRequest, type JsonRpcResponse, type JuneoClient } from './client'
import { type UTXOIndex, type GetUTXOsResponse } from './data'

export abstract class AbstractAPI {
  protected readonly client: JuneoClient
  private readonly endpoint: string
  private readonly service: string

  constructor (client: JuneoClient, endpoint: string, service: string) {
    this.client = client
    this.endpoint = endpoint
    this.service = service
  }

  protected async callServiceAt (
    service: string,
    endpoint: string,
    method: string,
    params?: object[] | string[]
  ): Promise<JsonRpcResponse> {
    return await this.client.rpcCall(
      `${endpoint}`,
      new JsonRpcRequest(`${service}${service.length > 0 ? '.' : ''}${method}`, params)
    )
  }

  protected async callAt (endpoint: string, method: string, params?: object[] | string[]): Promise<JsonRpcResponse> {
    return await this.callServiceAt(this.service, endpoint, method, params)
  }

  protected async call (method: string, params?: object[] | string[]): Promise<JsonRpcResponse> {
    return await this.callAt(this.endpoint, method, params)
  }
}

export abstract class AbstractUtxoAPI extends AbstractAPI {
  async getUTXOs (
    addresses: string[],
    limit?: number,
    startIndex?: UTXOIndex,
    encoding?: string
  ): Promise<GetUTXOsResponse> {
    const response: JsonRpcResponse = await this.call('getUTXOs', [{ addresses, limit, startIndex, encoding }])
    return response.result
  }

  async getUTXOsFrom (
    addresses: string[],
    sourceChain?: string,
    limit?: number,
    startIndex?: UTXOIndex,
    encoding?: string
  ): Promise<GetUTXOsResponse> {
    const response: JsonRpcResponse = await this.call('getUTXOs', [
      { addresses, sourceChain, limit, startIndex, encoding }
    ])
    return response.result
  }
}
