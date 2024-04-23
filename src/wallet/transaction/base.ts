import { type Blockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import {
  buildJVMBaseTransaction,
  buildPlatformBaseTransaction,
  type UnsignedTransaction,
  UserInput,
  type Utxo
} from '../../transaction'
import { type UtxoAccount } from '../account'
import { ChainOperationSummary, type SendOperation, type SendUtxoOperation } from '../operation'
import { BaseFeeData, FeeType, UtxoFeeData } from './fee'
import { BaseSpending, UtxoSpending } from './transaction'

async function getBaseTxFee (provider: MCNProvider, type: FeeType, chain: Blockchain): Promise<BaseFeeData> {
  return new BaseFeeData(chain, BigInt((await provider.info.getTxFee()).txFee), type)
}

export async function estimateBaseTransaction (
  provider: MCNProvider,
  chain: Blockchain,
  account: UtxoAccount,
  assetId: string,
  amount: bigint,
  addresses: string[],
  threshold: number,
  utxoSet: Utxo[],
  locktime: bigint = BigInt(0)
): Promise<UtxoFeeData> {
  const fee: BaseFeeData = await getBaseTxFee(provider, FeeType.BaseFee, chain)
  const transaction: UnsignedTransaction =
    chain.id === provider.platformChain.id
      ? buildPlatformBaseTransaction(
        [new UserInput(assetId, chain, amount, addresses, threshold, chain, locktime)],
        utxoSet,
        account.getSignersAddresses(),
        fee.amount,
        account.address,
        provider.mcn.id
      )
      : buildJVMBaseTransaction(
        [new UserInput(assetId, chain, amount, addresses, threshold, chain, locktime)],
        utxoSet,
        account.getSignersAddresses(),
        fee.amount,
        account.address,
        provider.mcn.id
      )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimateSendOperation (
  provider: MCNProvider,
  chain: Blockchain,
  account: UtxoAccount,
  send: SendOperation
): Promise<ChainOperationSummary> {
  const values = new Map<string, bigint>([[send.assetId, send.amount]])
  return await estimateBaseTransaction(
    provider,
    chain,
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
      return new ChainOperationSummary(provider, send, chain, fee, [spending, fee.spending], values)
    },
    async () => {
      const fee: BaseFeeData = await getBaseTxFee(provider, FeeType.BaseFee, chain)
      return new ChainOperationSummary(
        provider,
        send,
        chain,
        fee,
        [new BaseSpending(chain, send.amount, send.assetId), fee.spending],
        values
      )
    }
  )
}

export async function estimateSendUtxoOperation (
  provider: MCNProvider,
  chain: Blockchain,
  account: UtxoAccount,
  send: SendUtxoOperation
): Promise<ChainOperationSummary> {
  const values = new Map<string, bigint>([[send.assetId, send.amount]])
  return await estimateBaseTransaction(
    provider,
    chain,
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
      return new ChainOperationSummary(provider, send, chain, fee, [spending, fee.spending], values)
    },
    async () => {
      const fee: BaseFeeData = await getBaseTxFee(provider, FeeType.BaseFee, chain)
      return new ChainOperationSummary(
        provider,
        send,
        chain,
        fee,
        [new BaseSpending(chain, send.amount, send.assetId), fee.spending],
        values
      )
    }
  )
}
