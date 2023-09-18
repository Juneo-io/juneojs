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
