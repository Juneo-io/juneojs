import { type ethers } from 'ethers'
import { type JEVMAPI, type JVMAPI } from '../api'
import { JEVMBlockchain } from '../chain'
import { type JuneoWallet, type VMWallet } from './wallet'
import { EVMTransactionData, estimateEVMTransaction, sendEVMTransaction } from './common'
import { type EVMFeeData } from './fee'
import { FeeType, UserInput, type Utxo, buildJVMBaseTransaction, fetchUtxos } from '../transaction'
import { type MCNProvider } from '../juneo'

export class SendManager {
  private readonly provider: MCNProvider
  private readonly wallet: JuneoWallet

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  async sendEVM (chainId: string, assetId: string, amount: bigint, address: string): Promise<string> {
    const api: JEVMAPI = this.provider.jevm[chainId]
    const wallet: ethers.Wallet = this.wallet.getEthWallet(api.chain).evmWallet
    const isContract: boolean = JEVMBlockchain.isContractAddress(assetId)
    const to: string = isContract ? assetId : address
    const value: bigint = isContract ? BigInt(0) : amount
    const data: string = isContract ? await api.chain.getContractTransactionData(assetId, address, amount) : '0x'
    const feeData: EVMFeeData = await estimateEVMTransaction(api, wallet.address, to, value, data, FeeType.BaseFee)
    return await sendEVMTransaction(api, wallet, new EVMTransactionData(to, value, feeData, data))
  }

  async sendJVM (assetId: string, amount: bigint, address: string): Promise<string> {
    const api: JVMAPI = this.provider.jvm
    const wallet: VMWallet = this.wallet.getWallet(api.chain)
    const utxoSet: Utxo[] = await fetchUtxos(api, [wallet.getAddress()])
    const fee: bigint = await api.chain.queryBaseFee(this.provider)
    const transaction: string = buildJVMBaseTransaction([new UserInput(assetId, api.chain, amount, address, api.chain)],
      utxoSet, [wallet.getAddress()], fee, wallet.getAddress(), this.provider.mcn.id, api.chain.id
    ).signTransaction([wallet]).toCHex()
    return (await api.issueTx(transaction)).txID
  }
}
