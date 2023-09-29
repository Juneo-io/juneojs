import { type JVMBlockchain } from '../../chain'
import { AbstractUtxoAPI } from '../api'
import { type JsonRpcResponse, type JuneoClient } from '../client'
import { type GetBlockResponse, type GetHeightResponse, type GetTxResponse, type IssueTxResponse } from '../data'
import { type BuildGenesisResponse, type GetAssetDescriptionResponse } from './data'

const Service: string = 'jvm'
const VMEndpoint = '/vm/jvm'

export class JVMAPI extends AbstractUtxoAPI {
  chain: JVMBlockchain

  constructor (client: JuneoClient, chain: JVMBlockchain) {
    super(client, `/bc/${chain.id}`, Service)
    this.chain = chain
  }

  async buildGenesis (networkID: number, genesisData: JSON, encoding?: string): Promise<BuildGenesisResponse> {
    const response: JsonRpcResponse = await this.callAt(VMEndpoint, 'buildGenesis', [
      { networkID, genesisData, encoding }
    ])
    return response.result
  }

  async getAssetDescription (assetID: string): Promise<GetAssetDescriptionResponse> {
    const response: JsonRpcResponse = await this.call('getAssetDescription', [{ assetID }])
    return response.result
  }

  async getBlock (blockID: string, encoding?: string): Promise<GetBlockResponse> {
    const response: JsonRpcResponse = await this.call('getBlock', [{ blockID, encoding }])
    return response.result
  }

  async getBlockByHeight (height: number, encoding?: string): Promise<GetBlockResponse> {
    const response: JsonRpcResponse = await this.call('getBlockByHeight', [{ height, encoding }])
    return response.result
  }

  async getHeight (): Promise<GetHeightResponse> {
    const response: JsonRpcResponse = await this.call('getHeight')
    return response.result
  }

  async getTx (txID: string, encoding?: string): Promise<GetTxResponse> {
    const response: JsonRpcResponse = await this.call('getTx', [{ txID, encoding }])
    return response.result
  }

  async issueTx (tx: string, encoding?: string): Promise<IssueTxResponse> {
    const response: JsonRpcResponse = await this.call('issueTx', [{ tx, encoding }])
    return response.result
  }
}
