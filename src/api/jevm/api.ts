import { type JEVMBlockchain } from '../../chain'
import { AbstractUtxoAPI } from '../api'
import { type JsonRpcResponse, type JuneoClient } from '../client'
import { type IssueTxResponse } from '../data'
import { type GetAtomicTxResponse, type GetAtomicTxStatusResponse } from './data'

const Service: string = 'june'

export class JEVMAPI extends AbstractUtxoAPI {
  chain: JEVMBlockchain
  private readonly rpcEndpoint: string

  constructor (client: JuneoClient, chain: JEVMBlockchain) {
    super(client, `/bc/${chain.id}/june`, Service)
    this.chain = chain
    this.rpcEndpoint = `/bc/${chain.id}/rpc`
  }

  async getTx (txID: string, encoding?: string): Promise<GetAtomicTxResponse> {
    const response: JsonRpcResponse = await this.call('getAtomicTx', [{ txID, encoding }])
    return response.result
  }

  async getTxStatus (txID: string): Promise<GetAtomicTxStatusResponse> {
    const response: JsonRpcResponse = await this.call('getAtomicTxStatus', [{ txID }])
    return response.result
  }

  async issueTx (tx: string, encoding?: string): Promise<IssueTxResponse> {
    const response: JsonRpcResponse = await this.call('issueTx', [{ tx, encoding }])
    return response.result
  }

  async eth_getAssetBalance (address: string, block: string, assetID: string): Promise<bigint> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_getAssetBalance', [
      address,
      block,
      assetID
    ])
    return BigInt.asUintN(256, response.result)
  }

  async eth_baseFee (): Promise<bigint> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_baseFee')
    return BigInt.asUintN(256, response.result)
  }

  async eth_maxPriorityFeePerGas (): Promise<bigint> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_maxPriorityFeePerGas')
    return BigInt.asUintN(256, response.result)
  }

  async eth_getChainConfig (): Promise<JSON> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_getChainConfig')
    return response.result
  }

  async eth_getBalance (address: string, block: string): Promise<bigint> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_getBalance', [address, block])
    return BigInt.asUintN(256, response.result)
  }

  async eth_getTransactionCount (address: string, block: string): Promise<bigint> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_getTransactionCount', [
      address,
      block
    ])
    return BigInt.asUintN(256, response.result)
  }

  async eth_sendRawTransaction (transaction: string): Promise<string> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_sendRawTransaction', [
      transaction
    ])
    return response.result
  }

  async eth_getTransactionReceipt (hash: string): Promise<any> {
    const response: JsonRpcResponse = await this.callServiceAt('', this.rpcEndpoint, 'eth_getTransactionReceipt', [
      hash
    ])
    return response.result
  }
}
