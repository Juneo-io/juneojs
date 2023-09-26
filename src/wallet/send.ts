import { type ethers } from 'ethers'
import { type JEVMAPI, type JVMAPI } from '../api'
import { type Blockchain, JEVMBlockchain } from '../chain'
import { type MCNWallet, type VMWallet } from './wallet'
import { FeeType, type EVMFeeData, estimateEVMTransfer, sendEVMTransaction, type UtxoFeeData, estimateJVMBaseTransaction } from './transaction'
import { type Utxo } from '../transaction'
import { NetworkOperationType, ChainNetworkOperation } from './operation'
import { type MCNProvider } from '../juneo'

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
    const isContract: boolean = JEVMBlockchain.isContractAddress(assetId)
    const to: string = isContract ? assetId : address
    const value: bigint = isContract ? BigInt(0) : amount
    const data: string = isContract ? await api.chain.getContractTransactionData(assetId, address, amount) : '0x'
    return await estimateEVMTransfer(api, assetId, wallet.address, to, value, data, FeeType.BaseFee)
  }

  async sendEVM (chainId: string, assetId: string, amount: bigint, address: string, feeData?: EVMFeeData): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateSendEVM(chainId, assetId, amount, address)
    }
    const api: JEVMAPI = this.provider.jevm[chainId]
    const wallet: ethers.Wallet = this.wallet.getJEVMWallet(api.chain).evmWallet
    return await sendEVMTransaction(api, wallet, feeData)
  }

  async estimateSendJVM (assetId: string, amount: bigint, address: string, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
    return await estimateJVMBaseTransaction(this.provider, this.wallet, assetId, amount, address, utxoSet)
  }

  async sendJVM (assetId: string, amount: bigint, address: string, feeData?: UtxoFeeData, utxoSet?: Utxo[]): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateSendJVM(assetId, amount, address, utxoSet)
    }
    const api: JVMAPI = this.provider.jvm
    const wallet: VMWallet = this.wallet.getWallet(api.chain)
    const transaction: string = feeData.transaction.signTransaction([wallet]).toCHex()
    return (await api.issueTx(transaction)).txID
  }
}

export class SendOperation extends ChainNetworkOperation {
  assetId: string
  amount: bigint
  address: string

  constructor (chain: Blockchain, assetId: string, amount: bigint, address: string) {
    super(NetworkOperationType.Send, chain)
    this.assetId = assetId
    this.amount = amount
    this.address = address
  }
}
