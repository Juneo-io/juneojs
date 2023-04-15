import { ethers } from 'ethers'
import * as abi from './abi'

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
  queryTransferGasEstimate: (contractAddress: string, from: string, to: string, amount: bigint) => Promise<bigint>
  getTransferData: (contractAddress: string, to: string, amount: bigint) => string
}

export class ERC20ContractAdapter implements ContractAdapter {
  protected readonly provider: ethers.JsonRpcProvider

  constructor (provider: ethers.JsonRpcProvider) {
    this.provider = provider
  }

  async instanceOf (contractAddress: string): Promise<boolean> {
    const contract: ethers.Contract = this.getContract(contractAddress)
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
    const contract: ethers.Contract = this.getContract(contractAddress)
    return BigInt.asUintN(256, BigInt(await contract.balanceOf(address)))
  }

  async queryTransferGasEstimate (contractAddress: string, from: string, to: string, amount: bigint): Promise<bigint> {
    const data: string = this.getTransferData(contractAddress, to, amount)
    return await this.provider.estimateGas({
      from,
      to: contractAddress,
      value: BigInt(0),
      data
    })
  }

  getTransferData (contractAddress: string, to: string, amount: bigint): string {
    const contract: ethers.Contract = this.getContract(contractAddress)
    return contract.interface.encodeFunctionData('transfer', [to, amount])
  }

  protected getContract (contractAddress: string): ethers.Contract {
    return new ethers.Contract(contractAddress, abi.ERC20ABI, this.provider)
  }
}
