import { type JVMBlockchain } from '../../chain'
import { AbstractUtxoAPI, type ChainAPI } from '../api'
import { type JsonRpcResponse, type JuneoClient } from '../client'
import { type GetTxResponse, type GetTxStatusResponse, type IssueTxResponse } from '../data'
import { type BuildGenesisResponse, type GetAddressTxsResponse, type GetAllBalancesResponse, type GetAssetDescriptionResponse, type GetJVMBalanceResponse } from './data'

const Service: string = 'jvm'
const VMEndpoint = '/vm/jvm'

export class JVMAPI extends AbstractUtxoAPI implements ChainAPI {
  chain: JVMBlockchain

  constructor (client: JuneoClient, chain: JVMBlockchain) {
    super(client, `/bc/${chain.id}`, Service)
    this.chain = chain
  }

  async buildGenesis (networkID: number, genesisData: JSON, encoding?: string): Promise<BuildGenesisResponse> {
    const response: JsonRpcResponse = await this.callAt(VMEndpoint, 'buildGenesis', [{ networkID, genesisData, encoding }])
    return response.result
  }

  /**
   * @deprecated
   */
  async getAddressTxs (address: string, assetID: string, cursor?: number, pageSize?: number): Promise<GetAddressTxsResponse> {
    const response: JsonRpcResponse = await this.call('getAddressTxs', [{ address, assetID, cursor, pageSize }])
    return response.result
  }

  /**
   * @deprecated
   */
  async getAllBalances (address: string): Promise<GetAllBalancesResponse> {
    const response: JsonRpcResponse = await this.call('getAllBalances', [{ address }])
    return response.result
  }

  async getAssetDescription (assetID: string): Promise<GetAssetDescriptionResponse> {
    const response: JsonRpcResponse = await this.call('getAssetDescription', [{ assetID }])
    return response.result
  }

  /**
   * @deprecated
   */
  async getBalance (address: string, assetID: string): Promise<GetJVMBalanceResponse> {
    const response: JsonRpcResponse = await this.call('getBalance', [{ address, assetID }])
    return response.result
  }

  async getTx (txID: string, encoding?: string): Promise<GetTxResponse> {
    const response: JsonRpcResponse = await this.call('getTx', [{ txID, encoding }])
    return response.result
  }

  /**
   * @deprecated
   */
  async getTxStatus (txID: string): Promise<GetTxStatusResponse> {
    const response: JsonRpcResponse = await this.call('getTxStatus', [{ txID }])
    return response.result
  }

  async issueTx (tx: string, encoding?: string): Promise<IssueTxResponse> {
    const response: JsonRpcResponse = await this.call('issueTx', [{ tx, encoding }])
    return response.result
  }
}
