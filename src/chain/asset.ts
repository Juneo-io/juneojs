
export class JRC20Asset {
  id: string
  chainId: string
  contractAddress: string

  constructor (id: string, chainId: string, contractAddress: string) {
    this.id = id
    this.chainId = chainId
    this.contractAddress = contractAddress
  }
}
