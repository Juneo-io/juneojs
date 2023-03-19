import { type AxiosResponse } from 'axios'
import { HttpError, JsonRpcError, ProtocolError } from '../utils'
import axios from 'axios'

const jsonRpcVersion: string = '2.0'
const httpHeaders = {
  'Content-Type': 'application/json;charset=UTF-8'
}
const defaultProtocol: string = 'https'
const defaultHost: string = 'api1.mcnpoc4.xyz'
const defaultPort: number = 9650

export class JuneoClient {
  private protocol: string
  private host: string
  private port: number
  private nextRequestId: number = 1

  constructor (protocol?: string, host?: string, port?: number) {
    this.setProtocol(protocol)
    this.setHost(host)
    this.setPort(port)
  }

  setProtocol (protocol: string | undefined): void {
    if (protocol === undefined) {
      protocol = defaultProtocol
    }
    if (protocol !== 'http' && protocol !== 'https') {
      throw new ProtocolError('invalid protocol')
    }
    this.protocol = protocol
  }

  setHost (host: string | undefined): void {
    if (host === undefined) {
      this.host = defaultHost
    } else {
      this.host = host
    }
  }

  setPort (port: number | undefined): void {
    if (port === undefined) {
      this.port = defaultPort
    } else {
      this.port = port
    }
  }

  private async post (endpoint: string, data: any): Promise<AxiosResponse> {
    return await axios.post(endpoint,
      data,
      {
        method: 'post',
        baseURL: `${this.protocol}://${this.host}:${this.port}`,
        headers: httpHeaders,
        responseType: 'json',
        responseEncoding: 'utf8'
      })
  }

  async rpcCall (endpoint: string, request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const jsonRpcObject: any = request.getJsonRpcObject(this.nextRequestId++)
    const response: AxiosResponse = await this.post(endpoint, JSON.stringify(jsonRpcObject))
    const status = response.status
    if (status < 200 || status >= 300) {
      throw new HttpError('request status is not accepted')
    }
    this.nextRequestId++
    let data = response.data
    if (typeof data === 'string') {
      data = JSON.parse(data)
    }
    if (typeof data === 'object' && (data === null || 'error' in data)) {
      throw new JsonRpcError(data.error.message)
    }
    return new JsonRpcResponse(data.jsonrpc, data.id, data.result)
  }
}

export class JsonRpcRequest {
  method: string
  params: object[]

  constructor (method: string, params?: object[]) {
    this.method = method
    if (params === undefined) {
      this.params = []
    } else {
      this.params = params
    }
  }

  getJsonRpcObject (id: number): any {
    const jsonRpcObject: any = {}
    jsonRpcObject.jsonrpc = jsonRpcVersion
    jsonRpcObject.id = id
    jsonRpcObject.method = this.method
    jsonRpcObject.params = this.params
    return jsonRpcObject
  }
}

export class JsonRpcResponse {
  jsonrpc: string
  id: number
  result: string

  constructor (jsonrpc: string, id: number, result: string) {
    this.jsonrpc = jsonrpc
    this.id = id
    this.result = result
  }
}
