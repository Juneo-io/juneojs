import { type ethers } from 'ethers'
import { type JEVMAPI, type JVMAPI } from '../api'
import { type Blockchain, JEVMBlockchain } from '../chain'
import { type JuneoWallet, type VMWallet } from './wallet'
import { FeeType, type EVMFeeData, FeeData, EVMTransactionData, estimateEVMTransaction, sendEVMTransaction } from './transaction'
import { UserInput, type Utxo, buildJVMBaseTransaction, fetchUtxos } from '../transaction'
import { type MCNOperation, MCNOperationType } from './operation'
import { type MCNProvider } from '../juneo'

export class SendManager {
  private readonly provider: MCNProvider
  private readonly wallet: JuneoWallet

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  async estimateSendEVM (chainId: string, assetId: string, amount: bigint, address: string): Promise<EVMFeeData> {
    const api: JEVMAPI = this.provider.jevm[chainId]
    const wallet: ethers.Wallet = this.wallet.getEthWallet(api.chain).evmWallet
    const isContract: boolean = JEVMBlockchain.isContractAddress(assetId)
    const to: string = isContract ? assetId : address
    const value: bigint = isContract ? BigInt(0) : amount
    const data: string = isContract ? await api.chain.getContractTransactionData(assetId, address, amount) : '0x'
    return await estimateEVMTransaction(api, wallet.address, to, value, data, FeeType.BaseFee)
  }

  async sendEVM (chainId: string, assetId: string, amount: bigint, address: string, feeData?: EVMFeeData): Promise<string> {
    const api: JEVMAPI = this.provider.jevm[chainId]
    const wallet: ethers.Wallet = this.wallet.getEthWallet(api.chain).evmWallet
    const isContract: boolean = JEVMBlockchain.isContractAddress(assetId)
    const to: string = isContract ? assetId : address
    const value: bigint = isContract ? BigInt(0) : amount
    const data: string = isContract ? await api.chain.getContractTransactionData(assetId, address, amount) : '0x'
    if (typeof feeData === 'undefined') {
      feeData = await estimateEVMTransaction(api, wallet.address, to, value, data, FeeType.BaseFee)
    }
    return await sendEVMTransaction(api, wallet, new EVMTransactionData(to, value, feeData, data))
  }

  async estimateSendJVM (): Promise<FeeData> {
    const fee: bigint = BigInt((await this.provider.info.getTxFee()).txFee)
    const chain: Blockchain = this.provider.jvm.chain
    return new FeeData(chain, fee, chain.assetId, FeeType.BaseFee)
  }

  async sendJVM (assetId: string, amount: bigint, address: string, feeData?: FeeData): Promise<string> {
    const api: JVMAPI = this.provider.jvm
    const wallet: VMWallet = this.wallet.getWallet(api.chain)
    const utxoSet: Utxo[] = await fetchUtxos(api, [wallet.getAddress()])
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateSendJVM()
    }
    const transaction: string = buildJVMBaseTransaction([new UserInput(assetId, api.chain, amount, address, api.chain)],
      utxoSet, [wallet.getAddress()], feeData.amount, wallet.getAddress(), this.provider.mcn.id, api.chain.id
    ).signTransaction([wallet]).toCHex()
    return (await api.issueTx(transaction)).txID
  }
}

abstract class Send implements MCNOperation {
  type: MCNOperationType
  assetId: string
  amount: bigint
  address: string

  constructor (type: MCNOperationType, assetId: string, amount: bigint, address: string) {
    this.type = type
    this.assetId = assetId
    this.amount = amount
    this.address = address
  }
}

export class SendOperation extends Send {
  constructor (assetId: string, amount: bigint, address: string) {
    super(MCNOperationType.Send, assetId, amount, address)
  }
}
