import { type RelayBlockchain } from '../../chain'
import { type JuneoWallet, type MCNProvider } from '../../juneo'
import { TransactionReceipt, type VMWallet } from '../../wallet'
import { parseUtxoSet } from '../builder'
import { NodeId } from '../types'
import { type Utxo } from '../utxo'
import { buildAddDelegatorTransaction } from './builder'
import { RelayTransactionStatus, RelayTransactionStatusFetcher } from './transaction'
import { Validator } from './validation'

const StatusFetcherDelay: number = 100
const StatusFetcherMaxAttempts: number = 600

export enum StakeTransaction {
  PrimaryDelegation = 'Primary delegation',
  PrimaryValidation = 'Primary validation'
}

export class StakeManager {
  private readonly provider: MCNProvider
  private readonly wallet: JuneoWallet

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  delegate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint): StakeHandler {
    const handler: DelegationHandler = new DelegationHandler()
    void handler.execute(
      this.provider,
      this.wallet,
      new Validator(new NodeId(nodeId), startTime, endTime, amount)
    )
    return handler
  }
}

export interface StakeHandler {
  getReceipt: () => TransactionReceipt | undefined
}

interface ExecutableStakeHandler extends StakeHandler {
  execute: (provider: MCNProvider, wallet: JuneoWallet, validator: Validator) => Promise<void>
}

export class DelegationHandler implements ExecutableStakeHandler {
  private receipt: TransactionReceipt | undefined

  getReceipt (): TransactionReceipt | undefined {
    return this.receipt
  }

  async execute (provider: MCNProvider, wallet: JuneoWallet, validator: Validator): Promise<void> {
    const relay: RelayBlockchain = provider.mcn.primary.relay
    const relayWallet: VMWallet = wallet.getWallet(relay)
    const senders: string[] = [relayWallet.getAddress()]
    const utxoSet: Utxo[] = parseUtxoSet(await provider.relay.getUTXOs(senders))
    const fee: bigint = BigInt((await provider.getFees()).addPrimaryNetworkDelegatorFee)
    this.receipt = new TransactionReceipt(relay.id, StakeTransaction.PrimaryDelegation)
    const addDelegatorTransaction: string = buildAddDelegatorTransaction(
      utxoSet, senders, fee, relay, validator.nodeId, validator.startTime, validator.endTime, validator.weight,
      relay.assetId, relayWallet.getAddress(), relayWallet.getAddress(), provider.mcn.id
    ).sign([relayWallet]).toCHex()
    const transactionId = (await provider.relay.issueTx(addDelegatorTransaction)).txID
    this.receipt.transactionId = transactionId
    this.receipt.transactionStatus = RelayTransactionStatus.Unknown
    const transactionStatus: string = await new RelayTransactionStatusFetcher(provider.relay,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    this.receipt.transactionStatus = transactionStatus
  }
}
