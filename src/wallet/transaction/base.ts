import { type Blockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { Address, buildJVMBaseTransaction, buildPlatformBaseTransaction, UserInput, type Utxo } from '../../transaction'
import { type UtxoAccount } from '../account'
import { ChainOperationSummary, type SendOperation, type SendUtxoOperation } from '../operation'
import { BaseFeeData, UtxoFeeData } from './fee'
import { BaseSpending, TransactionType, UtxoSpending } from './transaction'

async function getBaseTxFee (provider: MCNProvider, type: TransactionType, chain: Blockchain): Promise<BaseFeeData> {
  return new BaseFeeData(chain, BigInt((await provider.info.getTxFee()).txFee), type)
}

export async function estimateBaseTransaction (
  provider: MCNProvider,
  chain: Blockchain,
  utxoSet: Utxo[],
  signersAddresses: Address[],
  changeAddress: string,
  assetId: string,
  amount: bigint,
  addresses: string[],
  threshold: number,
  locktime: bigint,
  stakeable: boolean
): Promise<UtxoFeeData> {
  const fee = await getBaseTxFee(provider, TransactionType.Base, chain)
  const transaction =
    chain.id === provider.platformChain.id
      ? buildPlatformBaseTransaction(
        [new UserInput(assetId, chain, amount, addresses, threshold, chain, locktime, stakeable)],
        utxoSet,
        signersAddresses,
        fee.amount,
        changeAddress,
        provider.mcn.id
      )
      : buildJVMBaseTransaction(
        [new UserInput(assetId, chain, amount, addresses, threshold, chain, locktime)],
        utxoSet,
        signersAddresses,
        fee.amount,
        changeAddress,
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
    account.utxoSet,
    Address.toAddresses(account.getSignersAddresses()),
    account.address,
    send.assetId,
    send.amount,
    [send.address],
    1,
    BigInt(0),
    false
  ).then(
    (fee) => {
      const spending = new UtxoSpending(chain, send.amount, send.assetId, fee.transaction.getUtxos())
      return new ChainOperationSummary(provider, send, chain, fee, [spending, fee.spending], values)
    },
    async (error) => {
      const fee = await getBaseTxFee(provider, TransactionType.Base, chain)
      return new ChainOperationSummary(
        provider,
        send,
        chain,
        fee,
        [new BaseSpending(chain, send.amount, send.assetId), fee.spending],
        values,
        [error]
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
  const fee = await getBaseTxFee(provider, TransactionType.Base, chain)
  // do not add a spending if utxoSet is defined as this means it is a multiSig op
  const hasSpending = typeof send.utxoSet === 'undefined'
  return await estimateBaseTransaction(
    provider,
    chain,
    send.getPreferredUtxoSet(account, fee.amount),
    send.getPreferredSigners(account),
    account.address,
    send.assetId,
    send.amount,
    send.addresses,
    send.threshold,
    send.locktime,
    send.stakeable
  ).then(
    (fee) => {
      const spendings = [fee.spending]
      if (hasSpending) {
        spendings.unshift(new UtxoSpending(chain, send.amount, send.assetId, fee.transaction.getUtxos()))
      }
      return new ChainOperationSummary(provider, send, chain, fee, spendings, values)
    },
    async (error) => {
      const spendings = [fee.spending]
      if (hasSpending) {
        spendings.unshift(new BaseSpending(chain, send.amount, send.assetId))
      }
      return new ChainOperationSummary(provider, send, chain, fee, spendings, values, [error])
    }
  )
}
