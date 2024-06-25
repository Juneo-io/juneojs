import { JsonRpcRequest, type JsonRpcResponse, type JuneoClient } from './client'
import { type GetTxResponse, type IssueTxResponse, type GetUTXOsResponse, type UTXOIndex } from './data'

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

export abstract class AbstractJuneoChainAPI extends AbstractAPI {
  async getTx (txID: string, encoding?: string): Promise<GetTxResponse> {
    const response: JsonRpcResponse = await this.call('getTx', [{ txID, encoding }])
    return response.result
  }

  async issueTx (tx: string, encoding?: string): Promise<IssueTxResponse> {
    const response: JsonRpcResponse = await this.call('issueTx', [{ tx, encoding }])
    return response.result
  }
}

export abstract class AbstractUtxoAPI extends AbstractJuneoChainAPI {
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
