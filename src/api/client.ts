import { type AxiosResponse } from 'axios'
import { HttpError, JsonRpcError, NetworkError, ProtocolError } from '../utils'
import axios from 'axios'

const JsonRpcVersion: string = '2.0'
const HttpHeaders = {
  'Content-Type': 'application/json;charset=UTF-8'
}
const DefaultProtocol: string = 'https'
const DefaultHost: string = 'api1.mcnpoc4.xyz'
const DefaultPort: number = 9650

export function parseAddress (address: string): JuneoClient {
  const protocolSplit: string[] = address.split('://')
  const protocol: string = protocolSplit.length > 1 ? protocolSplit[0] : DefaultProtocol
  const hostSplit: string[] = protocolSplit.length > 1 ? protocolSplit[1].split(':') : protocolSplit[0].split(':')
  const host: string = hostSplit[0]
  const port: number = hostSplit.length > 1 ? +hostSplit[1] : DefaultPort
  const client: JuneoClient = new JuneoClient()
  client.setProtocol(protocol)
  client.setHost(host)
  client.setPort(port)
  return client
}

export class JuneoClient {
  private protocol: string
  private host: string
  private port: number
  private nextRequestId: number = 1

  constructor () {
    this.protocol = DefaultProtocol
    this.host = DefaultHost
    this.port = DefaultPort
  }

  setProtocol (protocol: string): void {
    if (protocol === undefined) {
      this.protocol = DefaultProtocol
    }
    if (protocol !== 'http' && protocol !== 'https') {
      throw new ProtocolError(`invalid protocol "${protocol}"`)
    }
    this.protocol = protocol
  }

  setHost (host: string): void {
    if (host === undefined) {
      this.host = DefaultHost
    }
    this.host = host
  }

  setPort (port: number): void {
    if (port === undefined) {
      this.port = DefaultPort
    }
    this.port = port
  }

  private async post (endpoint: string, data: any): Promise<AxiosResponse> {
    return await axios.post(endpoint,
      data,
      {
        method: 'post',
        baseURL: `${this.protocol}://${this.host}:${this.port}`,
        headers: HttpHeaders,
        responseType: 'json',
        responseEncoding: 'utf8'
      })
  }

  async rpcCall (endpoint: string, request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const jsonRpcObject: any = request.getJsonRpcObject(this.nextRequestId++)
    const response: AxiosResponse = await this.post(endpoint, JSON.stringify(jsonRpcObject)).catch(error => {
      throw new NetworkError(error)
    })
    const status = response.status
    if (status < 200 || status >= 300) {
      throw new HttpError(`request status is not accepted "${status}"`)
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
    jsonRpcObject.jsonrpc = JsonRpcVersion
    jsonRpcObject.id = id
    jsonRpcObject.method = this.method
    jsonRpcObject.params = this.params
    return jsonRpcObject
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
