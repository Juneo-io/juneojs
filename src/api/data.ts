import { now } from '../utils'
import { type JsonRpcRequest, type JsonRpcResponse, type JuneoClient } from './client'

export class CachedResponse<T> {
  private response: T | undefined
  private lastUpdate: bigint = BigInt(0)
  duration: bigint | undefined

  constructor (duration?: bigint) {
    this.duration = duration
  }

  async rpcCall (
    client: JuneoClient,
    endpoint: string,
    request: JsonRpcRequest,
    forceUpdate: boolean = false
  ): Promise<T> {
    const update: boolean = this.shouldUpdate()
    if (!update && !forceUpdate && this.response !== undefined) {
      return this.response
    }
    const response: JsonRpcResponse = await client.rpcCall(endpoint, request)
    this.response = response.result
    return response.result
  }

  private shouldUpdate (): boolean {
    // no duration set never update
    if (this.duration === undefined) {
      return false
    }
    const currentTime: bigint = now()
    const update: boolean = currentTime >= this.lastUpdate + this.duration
    if (update) {
      this.lastUpdate = currentTime
    }
    return update
  }
}

export interface GetBlockResponse {
  block: string
  encoding: string
}

export interface GetHeightResponse {
  height: number
}

export interface GetUTXOsResponse {
  numFetched: number
  utxos: string[]
  endIndex: UTXOIndex
  encoding: string
}

export interface UTXOIndex {
  address: string
  utxo: string
}

export interface GetTxResponse {
  tx: string
  encoding: string
}

export interface GetTxStatusResponse {
  status: string
}

export interface IssueTxResponse {
  txID: string
}
