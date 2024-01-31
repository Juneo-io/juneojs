import { type ethers } from 'ethers'
import { type JEVMAPI, type JVMAPI } from '../api'
import { type JEVMWallet, type MCNWallet, type VMWallet } from './wallet'
import {
  FeeType,
  type EVMFeeData,
  estimateEVMTransfer,
  sendEVMTransaction,
  type UtxoFeeData,
  estimateJVMBaseTransaction
} from './transaction'
import { type Utxo } from '../transaction'
import { type MCNProvider } from '../juneo'
import { isContractAddress } from '../utils'

export class SendManager {
  private readonly provider: MCNProvider
  private readonly wallet: MCNWallet

  constructor (provider: MCNProvider, wallet: MCNWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  async estimateSendEVM (chainId: string, assetId: string, amount: bigint, address: string): Promise<EVMFeeData> {
    const api: JEVMAPI = this.provider.jevm[chainId]
    const wallet: ethers.Wallet = this.wallet.getJEVMWallet(api.chain).evmWallet
    const isContract: boolean = isContractAddress(assetId)
    const to: string = isContract ? assetId : address
    const value: bigint = isContract ? BigInt(0) : amount
    const data: string = isContract
      ? await api.chain.getContractTransactionData(this.provider, assetId, address, amount)
      : '0x'
    return await estimateEVMTransfer(api, assetId, wallet.address, to, value, data, FeeType.BaseFee)
  }

  async sendEVM (
    chainId: string,
    assetId: string,
    amount: bigint,
    address: string,
    feeData?: EVMFeeData
  ): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateSendEVM(chainId, assetId, amount, address)
    }
    const api: JEVMAPI = this.provider.jevm[chainId]
    const wallet: JEVMWallet = this.wallet.getJEVMWallet(api.chain)
    return await sendEVMTransaction(api, wallet, feeData)
  }

  async estimateSendJVM (
    assetId: string,
    amount: bigint,
    addresses: string[],
    threshold: number,
    utxoSet?: Utxo[]
  ): Promise<UtxoFeeData> {
    return await estimateJVMBaseTransaction(this.provider, this.wallet, assetId, amount, addresses, threshold, utxoSet)
  }

  async sendJVM (
    assetId: string,
    amount: bigint,
    addresses: string[],
    threshold: number,
    feeData?: UtxoFeeData,
    utxoSet?: Utxo[]
  ): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateSendJVM(assetId, amount, addresses, threshold, utxoSet)
    }
    const api: JVMAPI = this.provider.jvm
    const wallet: VMWallet = this.wallet.getWallet(api.chain)
    const transaction: string = feeData.transaction.signTransaction([wallet]).toCHex()
    return (await api.issueTx(transaction)).txID
  }
}
