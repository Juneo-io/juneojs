
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

export interface GetJVMBalanceResponse {
  balance: number
}
