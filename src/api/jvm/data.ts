
export interface BuildGenesisResponse {
  bytes: string
  encoding: string
}

/**
 * @deprecated
 */
export interface GetAddressTxsResponse {
  txIDS: string[]
  cursor: number
}

/**
 * @deprecated
 */
export interface GetAllBalancesResponse {
  balances: Balance[]
}

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
export interface GetJVMBalanceResponse {
  balance: number
}
