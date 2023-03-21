import { type Blockchain } from '../chain/chain'
import { JsonRpcRequest, type JsonRpcResponse, type JuneoClient } from './client'

const BaseEndpoint: string = '/ext'

export abstract class AbstractAPI {
  private readonly client: JuneoClient
  private readonly endpoint: string
  private readonly service: string

  constructor (client: JuneoClient, endpoint: string, service: string) {
    this.client = client
    this.endpoint = endpoint
    this.service = service
  }

  protected async callServiceAt (service: string, endpoint: string, method: string, params?: object[]): Promise<JsonRpcResponse> {
    const response: JsonRpcResponse = await this.client.rpcCall(`${BaseEndpoint}${endpoint}`,
      new JsonRpcRequest(`${service}.${method}`, params))
    return response
  }

  protected async callAt (endpoint: string, method: string, params?: object[]): Promise<JsonRpcResponse> {
    return await this.callServiceAt(this.service, endpoint, method, params)
  }

  protected async call (method: string, params?: object[]): Promise<JsonRpcResponse> {
    return await this.callAt(this.endpoint, method, params)
  }
}

export abstract class AbstractChainAPI extends AbstractAPI {
  private readonly chain: Blockchain

  constructor (client: JuneoClient, service: string, chain: Blockchain) {
    super(client, `/bc/${chain.id}`, service)
    this.chain = chain
  }
}
