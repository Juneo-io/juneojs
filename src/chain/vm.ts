export enum VMType {
  EVM = 'EVM',
  JVM = 'JVM',
  Custom = 'Custom',
}

export enum VMWalletType {
  Utxo = 'Utxo',
  Nonce = 'Nonce',
  Custom = 'Custom',
}

export class ChainVM {
  id: string
  type: VMType
  walletType: VMWalletType
  hdPath: number

  constructor (id: string, type: VMType, walletType: VMWalletType, hdPath: number) {
    this.id = id
    this.type = type
    this.walletType = walletType
    this.hdPath = hdPath
  }
}
