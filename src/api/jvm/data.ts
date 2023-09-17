export interface BuildGenesisResponse {
  bytes: string
  encoding: string
}

export interface GetAssetDescriptionResponse {
  assetID: string
  name: string
  symbol: string
  denomination: number
}
