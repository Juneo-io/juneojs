import { type TokenAsset, type AssetValue } from '../chain'

export class Account {
  balances: AccountBalance[]

  constructor (balances: AccountBalance[]) {
    this.balances = balances
  }
}

export interface AccountBalance {
  getBalance: (asset: TokenAsset) => AssetValue

  fetchBalances: () => Promise<void>
}
