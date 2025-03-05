import axios, { type AxiosResponse } from 'axios'
import { HttpError, JsonRpcError, NetworkError, ProtocolError } from '../utils'

const JsonRpcVersion = '2.0'
const HttpHeaders = {
  'Content-Type': 'application/json'
}
export const HttpProtocol = 'http'
export const HttpsProtocol = 'https'
const DefaultProtocol = HttpsProtocol
const Protocols: string[] = [HttpProtocol, HttpsProtocol]

export class JuneoClient {
  private nextRequestId = 1
  private protocol = DefaultProtocol
  private host = ''
  private url = ''

  private constructor () {}

  static parse (address: string): JuneoClient {
    const client = new JuneoClient()
    client.parseAddress(address)
    return client
  }

  getUrl (): string {
    return this.url
  }

  parseAddress (address: string): void {
    this.url = address
    const protocolSplit: string[] = address.split('://')
    const protocol = protocolSplit.length > 1 ? protocolSplit[0] : DefaultProtocol
    const host = protocolSplit.length > 1 ? protocolSplit[1] : protocolSplit[0]
    this.setProtocol(protocol)
    this.host = host
  }

  setProtocol (protocol: string): void {
    if (!Protocols.includes(protocol)) {
      throw new ProtocolError(`invalid protocol "${protocol}"`)
    }
    this.protocol = protocol
  }

  getProtocol (): string {
    return this.protocol
  }

  getNextRequestId (): number {
    return this.nextRequestId
  }

  async rpcCall (endpoint: string, request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const jsonRpcObject = request.getJsonRpcObject(this.nextRequestId++)
    const response = await this.post(endpoint, JSON.stringify(jsonRpcObject))
    const status = response.status
    if (status < 200 || status >= 300) {
      throw new HttpError(`request status is not accepted "${status}"`)
    }
    let data = response.data
    if (typeof data === 'string') {
      data = JSON.parse(data)
    }
    if (data === null || data.error !== undefined) {
      throw new JsonRpcError(data.error.message)
    }
    return new JsonRpcResponse(data.jsonrpc, data.id, data.result)
  }

  async post (endpoint: string, data: any): Promise<AxiosResponse> {
    return await axios
      .post(endpoint, data, {
        method: 'post',
        baseURL: `${this.protocol}://${this.host}`,
        headers: HttpHeaders,
        responseType: 'json',
        responseEncoding: 'utf8'
      })
      .catch((error) => {
        throw new NetworkError(error.message)
      })
  }

  async get (endpoint: string): Promise<AxiosResponse> {
    return await axios
      .get(endpoint, {
        method: 'get',
        baseURL: `${this.protocol}://${this.host}`,
        headers: HttpHeaders,
        responseType: 'json',
        responseEncoding: 'utf8'
      })
      .catch((error) => {
        throw new NetworkError(error.message)
      })
  }
}

export class JsonRpcRequest {
  method: string
  params: object[] | string[]

  constructor (method: string, params: object[] | string[] = []) {
    this.method = method
    this.params = params
  }

  getJsonRpcObject (id: number): any {
    return {
      jsonrpc: JsonRpcVersion,
      id,
      method: this.method,
      params: this.params
    }
  }
}

export class JsonRpcResponse {
  jsonrpc: string
  id: number
  result: any

  constructor (jsonrpc: string, id: number, result: string) {
    this.jsonrpc = jsonrpc
    this.id = id
    this.result = result
  }
}
