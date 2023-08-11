import { type PlatformBlockchain } from '../chain'
import { type JuneoWallet, type MCNProvider } from '../juneo'
import { NodeId } from '../transaction/types'
import { parseUtxoSet, type Utxo } from '../transaction/utxo'
import { buildAddDelegatorTransaction, buildAddValidatorTransaction } from '../transaction/platform/builder'
import { PlatformTransactionStatus, PlatformTransactionStatusFetcher } from '../transaction/platform/transaction'
import { Validator } from '../transaction/platform/validation'
import { TransactionReceipt } from './transfer'
import { type VMWallet } from './wallet'
import { calculatePrimary, now } from '../utils'

const StatusFetcherDelay: number = 100
const StatusFetcherMaxAttempts: number = 600
const ValidationShare: number = 12_0000 // 12%
const DelegationShare: number = 100_0000 - ValidationShare

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

  estimateValidation (stakePeriod: bigint, stakeAmount: bigint): bigint {
    return calculatePrimary(stakePeriod, now(), stakeAmount)
  }

  estimateDelegation (stakePeriod: bigint, stakeAmount: bigint): bigint {
    let rewards: bigint = calculatePrimary(stakePeriod, now(), stakeAmount)
    rewards = rewards * BigInt(DelegationShare) / BigInt(1000000)
    return rewards
  }

  delegate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint): StakeHandler {
    const handler: DelegationHandler = new DelegationHandler()
    void handler.execute(
      this.provider,
      this.wallet,
      new Validator(new NodeId(nodeId), startTime, endTime, amount)
    ).catch(error => {
      throw error
    })
    return handler
  }

  validate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint): StakeHandler {
    const handler: ValidationHandler = new ValidationHandler()
    void handler.execute(
      this.provider,
      this.wallet,
      new Validator(new NodeId(nodeId), startTime, endTime, amount)
    ).catch(error => {
      throw error
    })
    return handler
  }
}

export interface StakeHandler {
  getReceipt: () => TransactionReceipt | undefined
}

interface ExecutableStakeHandler extends StakeHandler {
  execute: (provider: MCNProvider, wallet: JuneoWallet, validator: Validator) => Promise<void>
}

class DelegationHandler implements ExecutableStakeHandler {
  private receipt: TransactionReceipt | undefined

  getReceipt (): TransactionReceipt | undefined {
    return this.receipt
  }

  async execute (provider: MCNProvider, wallet: JuneoWallet, validator: Validator): Promise<void> {
    const platform: PlatformBlockchain = provider.mcn.primary.platform
    const platformWallet: VMWallet = wallet.getWallet(platform)
    const senders: string[] = [platformWallet.getAddress()]
    const utxoSet: Utxo[] = parseUtxoSet(await provider.platform.getUTXOs(senders))
    const fee: bigint = BigInt((await provider.getFees()).addPrimaryNetworkDelegatorFee)
    this.receipt = new TransactionReceipt(platform.id, StakeTransaction.PrimaryDelegation)
    const addDelegatorTransaction: string = buildAddDelegatorTransaction(
      utxoSet, senders, fee, platform, validator.nodeId, validator.startTime, validator.endTime, validator.weight,
      platform.assetId, platformWallet.getAddress(), platformWallet.getAddress(), provider.mcn.id
    ).signTransaction([platformWallet]).toCHex()
    const transactionId = (await provider.platform.issueTx(addDelegatorTransaction)).txID
    this.receipt.transactionId = transactionId
    this.receipt.transactionStatus = PlatformTransactionStatus.Unknown
    const transactionStatus: string = await new PlatformTransactionStatusFetcher(provider.platform,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    this.receipt.transactionStatus = transactionStatus
  }
}

class ValidationHandler implements ExecutableStakeHandler {
  private receipt: TransactionReceipt | undefined

  getReceipt (): TransactionReceipt | undefined {
    return this.receipt
  }

  async execute (provider: MCNProvider, wallet: JuneoWallet, validator: Validator): Promise<void> {
    const platform: PlatformBlockchain = provider.mcn.primary.platform
    const platformWallet: VMWallet = wallet.getWallet(platform)
    const senders: string[] = [platformWallet.getAddress()]
    const utxoSet: Utxo[] = parseUtxoSet(await provider.platform.getUTXOs(senders))
    const fee: bigint = BigInt((await provider.getFees()).addPrimaryNetworkDelegatorFee)
    this.receipt = new TransactionReceipt(platform.id, StakeTransaction.PrimaryDelegation)
    const addValidatorTransaction: string = buildAddValidatorTransaction(
      utxoSet, senders, fee, platform, validator.nodeId, validator.startTime, validator.endTime, validator.weight,
      platform.assetId, ValidationShare, platformWallet.getAddress(), platformWallet.getAddress(), provider.mcn.id
    ).signTransaction([platformWallet]).toCHex()
    const transactionId = (await provider.platform.issueTx(addValidatorTransaction)).txID
    this.receipt.transactionId = transactionId
    this.receipt.transactionStatus = PlatformTransactionStatus.Unknown
    const transactionStatus: string = await new PlatformTransactionStatusFetcher(provider.platform,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    this.receipt.transactionStatus = transactionStatus
  }
}
