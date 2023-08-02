import { FeeData, type JEVMBlockchain, type JuneoWallet, type MCNProvider } from '../juneo'
import { WETHContractAdapter } from '../solidity'

export enum WrapFeeType {
  Wrap = 'Wrap fee',
  Unwrap = 'Unwrap fee'
}

export class WrapManager {
  private readonly provider: MCNProvider
  private readonly chain: JEVMBlockchain
  private readonly adapter: WETHContractAdapter
  private readonly wallet: JuneoWallet
  private readonly contract: string

  constructor (provider: MCNProvider, chain: JEVMBlockchain, wallet: JuneoWallet, contract: string) {
    this.provider = provider
    this.chain = chain
    this.adapter = new WETHContractAdapter(this.chain.ethProvider)
    this.wallet = wallet
    this.contract = contract
  }

  async estimateWrapFee (amount: bigint): Promise<FeeData> {
    let txFee: bigint = await this.chain.queryBaseFee(this.provider)
    const hexAddress: string = this.wallet.getEthAddress(this.chain)
    const data: string = this.adapter.getDepositData(this.contract)
    txFee *= await this.chain.ethProvider.estimateGas({
      from: hexAddress,
      to: this.contract,
      value: BigInt(amount),
      data
    })
    return new FeeData(this.chain, txFee, this.contract, WrapFeeType.Wrap)
  }

  async estimateUnwrapFee (amount: bigint): Promise<FeeData> {
    let txFee: bigint = await this.chain.queryBaseFee(this.provider)
    const hexAddress: string = this.wallet.getEthAddress(this.chain)
    const data: string = this.adapter.getWithdrawData(this.contract, amount)
    txFee *= await this.chain.ethProvider.estimateGas({
      from: hexAddress,
      to: this.contract,
      value: BigInt(0),
      data
    })
    return new FeeData(this.chain, txFee, this.contract, WrapFeeType.Unwrap)
  }
}
