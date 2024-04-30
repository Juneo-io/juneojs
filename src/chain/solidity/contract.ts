import { ethers } from 'ethers'
import * as abi from './abi'
import { AssetId } from '../../transaction'
import { ERC20Asset, type TokenAsset } from '../../asset'

export class ContractManager {
  private readonly handlers: SolidityTokenHandler[] = []

  async getHandler (contractAddress: string): Promise<SolidityTokenHandler | null> {
    for (const handler of this.handlers) {
      if (await handler.instanceOf(contractAddress)) {
        return handler
      }
    }
    return null
  }

  registerHandler (handler: SolidityTokenHandler): void {
    // register at first position because of getHandler iteration implementation
    // since specific handler may have common functions with default ones
    // it is preferable to check if it is part of those first.
    // Should do a better getHandler function in the future
    this.handlers.unshift(handler)
  }

  async balanceOf (provider: ethers.JsonRpcProvider, contractAddress: string, address: string): Promise<bigint> {
    const contract: ethers.Contract = new ethers.Contract(contractAddress, abi.BalanceOfABI, provider)
    return BigInt.asUintN(256, BigInt(await contract.balanceOf(address)))
  }

  getTransferData (provider: ethers.JsonRpcProvider, contractAddress: string, to: string, amount: bigint): string {
    const contract: ethers.Contract = new ethers.Contract(contractAddress, abi.TransferABI, provider)
    return contract.interface.encodeFunctionData('transfer', [to, amount])
  }
}

export interface SolidityTokenHandler {
  instanceOf: (contractAddress: string) => Promise<boolean>

  queryTokenData: (contractAddress: string) => Promise<TokenAsset>
}

export class ERC20TokenHandler implements SolidityTokenHandler {
  protected readonly provider: ethers.JsonRpcProvider

  constructor (provider: ethers.JsonRpcProvider) {
    this.provider = provider
  }

  async instanceOf (contractAddress: string): Promise<boolean> {
    const contract: ethers.Contract = this.getContract(contractAddress)
    // checking if is ERC20 by calling decimals read only function
    // other main tokens interfaces should not be using decimals
    // IERC165 is not widespread enough to be used by ERC20 tokens
    await contract.decimals().catch(() => {
      return false
    })
    return true
  }

  async queryTokenData (contractAddress: string): Promise<TokenAsset> {
    const contract: ethers.Contract = this.getContract(contractAddress)
    const name: string = await contract.name()
    const symbol: string = await contract.symbol()
    const decimals: number = await contract.decimals()
    return new ERC20Asset(contractAddress, name, symbol, decimals)
  }

  protected getContract (contractAddress: string): ethers.Contract {
    return new ethers.Contract(contractAddress, abi.ERC20ABI, this.provider)
  }
}

export class EVMCallAdapter {
  private readonly contract: ethers.Contract

  constructor (contractAddress: string, abi: string[]) {
    this.contract = new ethers.Contract(contractAddress, abi)
  }

  getFunctionData (name: string, parameters: any[] = []): string {
    return this.contract.interface.encodeFunctionData(name, parameters)
  }
}

export class JRC20ContractAdapter extends EVMCallAdapter {
  private readonly contractAddress: string

  constructor (contractAddress: string) {
    super(contractAddress, abi.JRC20ABI)
    this.contractAddress = contractAddress
  }

  getWithdrawData (value: bigint): string {
    return this.getFunctionData('withdraw', [value])
  }

  getDepositData (assetId: string, amount: bigint): string {
    // native asset call data
    let data: string = ethers.solidityPacked(
      ['address', 'uint256', 'uint256'],
      [this.contractAddress, `0x${new AssetId(assetId).serialize().toHex()}`, amount]
    )
    // add deposit function removed hex prefix
    data += this.getFunctionData('deposit').substring(2)
    return data
  }
}

export class WrappedContractAdapter extends EVMCallAdapter {
  constructor (contractAddress: string) {
    super(contractAddress, abi.WrappedABI)
  }

  getWithdrawData (value: bigint): string {
    return this.getFunctionData('withdraw', [value])
  }

  getDepositData (): string {
    return this.getFunctionData('deposit')
  }
}

export class AuctionContractAdapter extends EVMCallAdapter {
  constructor (contractAddress: string) {
    super(contractAddress, abi.AuctionABI)
  }

  getRedeemAuctionData (auctionId: bigint): string {
    return this.getFunctionData('redeemAuction', [auctionId])
  }
}

export class StreamContractAdapter extends EVMCallAdapter {
  constructor (contractAddress: string) {
    super(contractAddress, abi.StreamABI)
  }

  getWithdrawFromStreamData (streamId: bigint, amount: bigint): string {
    return this.getFunctionData('withdrawFromStream', [streamId, amount])
  }

  getCancelStreamData (streamId: bigint): string {
    return this.getFunctionData('cancelStream', [streamId])
  }
}
