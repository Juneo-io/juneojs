
export interface BuildGenesisResponse {
  bytes: string
  encoding: string
}

export interface GetAddressTxsResponse {
  txIDS: string[]
  cursor: number
}

export interface GetAllBalancesResponse {
  balances: Balance[]
}

export interface Balance {
  asset: string
  balance: number
}

export interface GetAssetDescriptionResponse {
  assetID: string
  name: string
  symbol: string
  denomination: number
}

export interface GetBalanceResponse {
  balance: number
}

export interface GetTxResponse {
  tx: string
  encoding: string
}

export interface GetTxStatusResponse {
  status: string
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

export interface IssueTxResponse {
  txID: string
}
