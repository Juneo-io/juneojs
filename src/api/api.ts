import { JsonRpcRequest, type JsonRpcResponse, type JuneoClient } from './client'

export abstract class AbstractAPI {
  private readonly client: JuneoClient
  private readonly endpoint: string
  private readonly methodCallHeader: string

  constructor (client: JuneoClient, endpoint: string, methodCallHeader: string) {
    this.client = client
    this.endpoint = endpoint
    this.methodCallHeader = methodCallHeader
  }

  protected async callAt (endpoint: string, methodName: string, params?: object[]): Promise<JsonRpcResponse> {
    const response: JsonRpcResponse = await this.client.rpcCall(endpoint,
      new JsonRpcRequest(this.getMethod(methodName), params))
    return response
  }

  protected async call (methodName: string, params?: object[]): Promise<JsonRpcResponse> {
    return await this.callAt(this.endpoint, methodName, params)
  }

  private getMethod (name: string): string {
    return `${this.methodCallHeader}.${name}`
  }
}
