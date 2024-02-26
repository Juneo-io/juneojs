import { type JVMAPI } from '../../api'
import { type JVMBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { type Utxo, type UnsignedTransaction, buildJVMBaseTransaction, UserInput } from '../../transaction'
import { type JVMAccount } from '../account'
import { ChainOperationSummary, type SendUtxoOperation, type SendOperation } from '../operation'
import { BaseFeeData, FeeType, UtxoFeeData } from './fee'
import { BaseSpending, UtxoSpending } from './transaction'

async function getJVMBaseTxFee (provider: MCNProvider, type: FeeType): Promise<BaseFeeData> {
  return new BaseFeeData(provider.jvm.chain, BigInt((await provider.info.getTxFee()).txFee), type)
}

export async function estimateJVMBaseTransaction (
  provider: MCNProvider,
  account: JVMAccount,
  assetId: string,
  amount: bigint,
  addresses: string[],
  threshold: number,
  utxoSet: Utxo[],
  locktime: bigint = BigInt(0)
): Promise<UtxoFeeData> {
  const api: JVMAPI = provider.jvm
  const fee: BaseFeeData = await getJVMBaseTxFee(provider, FeeType.BaseFee)
  const transaction: UnsignedTransaction = buildJVMBaseTransaction(
    [new UserInput(assetId, api.chain, amount, addresses, threshold, api.chain, locktime)],
    utxoSet,
    account.getSignersAddresses(),
    fee.amount,
    account.address,
    provider.mcn.id,
    api.chain.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimateJVMSendOperation (
  provider: MCNProvider,
  account: JVMAccount,
  send: SendOperation
): Promise<ChainOperationSummary> {
  const chain: JVMBlockchain = provider.jvm.chain
  const values = new Map<string, bigint>([[send.assetId, send.amount]])
  return await estimateJVMBaseTransaction(
    provider,
    account,
    send.assetId,
    send.amount,
    [send.address],
    1,
    account.utxoSet,
    BigInt(0)
  ).then(
    (fee) => {
      const spending: UtxoSpending = new UtxoSpending(chain, send.amount, send.assetId, fee.transaction.getUtxos())
      return new ChainOperationSummary(send, chain, fee, [spending, fee.spending], values)
    },
    async () => {
      const fee: BaseFeeData = await getJVMBaseTxFee(provider, FeeType.BaseFee)
      return new ChainOperationSummary(
        send,
        chain,
        fee,
        [new BaseSpending(chain, send.amount, send.assetId), fee.spending],
        values
      )
    }
  )
}

export async function estimateJVMSendUtxoOperation (
  provider: MCNProvider,
  account: JVMAccount,
  send: SendUtxoOperation
): Promise<ChainOperationSummary> {
  const chain: JVMBlockchain = provider.jvm.chain
  const values = new Map<string, bigint>([[send.assetId, send.amount]])
  return await estimateJVMBaseTransaction(
    provider,
    account,
    send.assetId,
    send.amount,
    send.addresses,
    send.threshold,
    account.utxoSet,
    send.locktime
  ).then(
    (fee) => {
      const spending: UtxoSpending = new UtxoSpending(chain, send.amount, send.assetId, fee.transaction.getUtxos())
      return new ChainOperationSummary(send, chain, fee, [spending, fee.spending], values)
    },
    async () => {
      const fee: BaseFeeData = await getJVMBaseTxFee(provider, FeeType.BaseFee)
      return new ChainOperationSummary(
        send,
        chain,
        fee,
        [new BaseSpending(chain, send.amount, send.assetId), fee.spending],
        values
      )
    }
  )
}
