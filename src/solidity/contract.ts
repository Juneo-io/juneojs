import { ethers } from 'ethers'
import * as abi from './abi'
import { AssetId } from '../transaction'

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
    // register at first position because of getAdapter iteration implementation
    // since specific adapter may have common functions with default ones
    // it is preferable to check if it is part of those first.
    // Should do a better getAdapter function in the future
    this.adapters.unshift(adapter)
  }

  registerAdapters (adapters: ContractAdapter[]): void {
    adapters.forEach(adapter => {
      this.adapters.unshift(adapter)
    })
  }
}

export interface ContractAdapter {
  instanceOf: (contractAddress: string) => Promise<boolean>
  queryBalance: (contractAddress: string, address: string) => Promise<bigint>
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

  getTransferData (contractAddress: string, to: string, amount: bigint): string {
    const contract: ethers.Contract = this.getContract(contractAddress)
    return contract.interface.encodeFunctionData('transfer', [to, amount])
  }

  protected getContract (contractAddress: string): ethers.Contract {
    return new ethers.Contract(contractAddress, abi.ERC20ABI, this.provider)
  }
}

export class JRC20ContractAdapter extends ERC20ContractAdapter {
  override async instanceOf (contractAddress: string): Promise<boolean> {
    const contract: ethers.Contract = this.getContract(contractAddress)
    // checking if is JRC20 by calling nativeAssetId read only function
    // other main tokens interfaces should not be using nativeAssetId
    try {
      await contract.nativeAssetId()
    } catch (error) {
      return false
    }
    return true
  }

  getWithdrawData (contractAddress: string, value: bigint): string {
    const contract: ethers.Contract = this.getContract(contractAddress)
    return contract.interface.encodeFunctionData('withdraw', [value])
  }

  getDepositData (contractAddress: string, assetId: string, amount: bigint): string {
    const contract: ethers.Contract = this.getContract(contractAddress)
    // native asset call data
    let data: string = ethers.solidityPacked(
      ['address', 'uint256', 'uint256'],
      [contractAddress, `0x${new AssetId(assetId).serialize().toHex()}`, amount]
    )
    // add deposit function removed hex prefix
    data += contract.interface.encodeFunctionData('deposit').substring(2)
    return data
  }

  protected override getContract (contractAddress: string): ethers.Contract {
    return new ethers.Contract(contractAddress, abi.JRC20ABI, this.provider)
  }
}

export class WETHContractAdapter extends ERC20ContractAdapter {
  readonly contractAddress: string
  private readonly contract: ethers.Contract

  constructor (provider: ethers.JsonRpcProvider, contractAddress: string) {
    super(provider)
    this.contractAddress = contractAddress
    this.contract = new ethers.Contract(this.contractAddress, abi.WETHABI, this.provider)
  }

  getWithdrawData (value: bigint): string {
    return this.contract.interface.encodeFunctionData('withdraw', [value])
  }

  getDepositData (): string {
    return this.contract.interface.encodeFunctionData('deposit')
  }
}
