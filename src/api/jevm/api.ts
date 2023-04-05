import { type JEVMBlockchain } from '../../chain'
import { AbstractChainAPI } from '../api'
import { type JsonRpcResponse, type JuneoClient } from '../client'
import { type UTXOIndex, type GetUTXOsResponse, type IssueTxResponse } from '../data'
import { type GetAtomicTxResponse, type GetAtomicTxStatusResponse } from './data'

const Service: string = 'june'

export class JEVMAPI extends AbstractChainAPI {
  private readonly juneEndpoint: string
  private readonly rpcEndpoint: string

  constructor (client: JuneoClient, chain: JEVMBlockchain) {
    super(client, Service, chain)
    this.juneEndpoint = `/bc/${chain.id}/june`
    this.rpcEndpoint = `/bc/${chain.id}/rpc`
  }

  async getTx (txID: string, encoding?: string): Promise<GetAtomicTxResponse> {
    const response: JsonRpcResponse = await this.callAt(this.juneEndpoint, 'getAtomicTx', [{ txID, encoding }])
    return response.result
  }

  async getTxStatus (txID: string): Promise<GetAtomicTxStatusResponse> {
    const response: JsonRpcResponse = await this.callAt(this.juneEndpoint, 'getAtomicTxStatus', [{ txID }])
    return response.result
  }

  async getUTXOs (addresses: string[], sourceChain?: string, limit?: number, startIndex?: UTXOIndex, encoding?: string): Promise<GetUTXOsResponse> {
    const response: JsonRpcResponse = await this.callAt(this.juneEndpoint, 'getUTXOs', [{ addresses, sourceChain, limit, startIndex, encoding }])
    return response.result
  }

  async issueTx (tx: string, encoding?: string): Promise<IssueTxResponse> {
    const response: JsonRpcResponse = await this.callAt(this.juneEndpoint, 'issueTx', [{ tx, encoding }])
    return response.result
  }

  async eth_getAssetBalance (address: string, blk: string, assetID: string): Promise<bigint> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_getAssetBalance', [{ address, blk, assetID }])
    return response.result
  }

  async eth_baseFee (): Promise<bigint> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_baseFee')
    return response.result
  }

  async eth_maxPriorityFeePerGas (): Promise<bigint> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_maxPriorityFeePerGas')
    return response.result
  }

  async eth_getChainConfig (): Promise<JSON> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_getChainConfig')
    return response.result
  }
}
