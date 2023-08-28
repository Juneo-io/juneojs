import { type JVMAPI } from '../../api'
import { type Blockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { type Utxo, type UnsignedTransaction, buildJVMBaseTransaction, UserInput, fetchUtxos } from '../../transaction'
import { type JuneoWallet } from '../wallet'
import { FeeData, FeeType } from './fee'
import { Spending } from './transaction'

export class UtxoFeeData extends FeeData {
  transaction: UnsignedTransaction

  constructor (chain: Blockchain, amount: bigint, type: string, transaction: UnsignedTransaction) {
    super(chain, amount, type)
    this.transaction = transaction
  }
}

export class UtxoSpending extends Spending {
  utxos: Utxo[]

  constructor (chainId: string, amount: bigint, assetId: string, utxos: Utxo[]) {
    super(chainId, amount, assetId)
    this.utxos = utxos
  }
}

export async function estimateJVMBaseTransaction (provider: MCNProvider, wallet: JuneoWallet, assetId: string, amount: bigint, address: string, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
  const fee: bigint = BigInt((await provider.info.getTxFee()).txFee)
  const api: JVMAPI = provider.jvm
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [wallet.getAddress(api.chain)])
  }
  const transaction: UnsignedTransaction = buildJVMBaseTransaction([new UserInput(assetId, api.chain, amount, address, api.chain)],
    utxoSet, [wallet.getAddress(api.chain)], fee, wallet.getAddress(api.chain), provider.mcn.id, api.chain.id
  )
  return new UtxoFeeData(api.chain, fee, FeeType.BaseFee, transaction)
}
