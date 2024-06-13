import MetaMaskSDK from '@metamask/sdk'

export class MCNMetaMask {
  private readonly metaMask: MetaMaskSDK

  constructor (dappMetadata: DappMetadata) {
    this.metaMask = new MetaMaskSDK({
      dappMetadata
    })
  }

  getSDK (): MetaMaskSDK {
    return this.metaMask
  }
}

export class DappMetadata {
  name: string
  url?: string
  base64Icon?: string

  constructor (name: string, url?: string, base64Icon?: string) {
    this.name = name
    this.url = url
    this.base64Icon = base64Icon
  }
}
