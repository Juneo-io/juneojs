export enum VMWalletType {
  Utxo = 'Utxo',
  Nonce = 'Nonce',
}

export class ChainVM {
  id: string
  walletType: VMWalletType
  hdPath: number

  constructor (id: string, walletType: VMWalletType, hdPath: number) {
    this.id = id
    this.walletType = walletType
    this.hdPath = hdPath
  }
}
