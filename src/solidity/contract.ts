import { ethers } from 'ethers'
import { BaseERC20ABI } from './abi'

export class ContractHandler {
  private readonly adapters: ContractAdapter[] = []

  async getAdapter (contractAddress: string): Promise<ContractAdapter | null> {
    for (let i: number = 0; i < this.adapters.length; i++) {
      const adapter: ContractAdapter = this.adapters[i]
      if (await adapter.instanceOf(contractAddress)) {
        return adapter
      }
    }
    return null
  }

  registerAdapter (adapter: ContractAdapter): void {
    this.adapters.push(adapter)
  }

  registerAdapters (adapters: ContractAdapter[]): void {
    adapters.forEach(adapter => {
      this.adapters.push(adapter)
    })
  }
}

export interface ContractAdapter {
  instanceOf: (contractAddress: string) => Promise<boolean>
  queryBalance: (contractAddress: string, address: string) => Promise<bigint>
}

export class ERC20ContractAdapter implements ContractAdapter {
  private readonly provider: ethers.JsonRpcProvider

  constructor (provider: ethers.JsonRpcProvider) {
    this.provider = provider
  }

  async instanceOf (contractAddress: string): Promise<boolean> {
    const contract: ethers.Contract = new ethers.Contract(contractAddress, BaseERC20ABI, this.provider)
    // checking if is ERC20 by calling decimals read only function
    // other main tokens interfaces should not be using decimals
    // IERC165 is not widespread enough to be used by ERC20 tokens
    try {
      await contract.decimals()
    } catch (error) {
      return false
    }
    return true
  }

  async queryBalance (contractAddress: string, address: string): Promise<bigint> {
    const contract: ethers.Contract = new ethers.Contract(contractAddress, BaseERC20ABI, this.provider)
    return BigInt.asUintN(256, BigInt(await contract.balanceOf(address)))
  }
}
