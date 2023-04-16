import { type GetTxResponse } from '../api/data'
import { type GetCurrentValidatorsResponse, type Validator as APIValidator, type Delegator, type GetPendingValidatorsResponse, type PendingValidator, type PendingDelegator } from '../api/relay/data'
import { type RelayBlockchain } from '../chain'
import { type JuneoWallet, type MCNProvider } from '../juneo'
import { Address, NodeId } from '../transaction/types'
import { parseUtxoSet, type Utxo } from '../transaction/utxo'
import { buildAddDelegatorTransaction, buildAddValidatorTransaction } from '../transaction/relay/builder'
import { AddDelegatorTransaction, AddValidatorTransaction, RelayTransactionStatus, RelayTransactionStatusFetcher } from '../transaction/relay/transaction'
import { type Secp256k1OutputOwners, Validator } from '../transaction/relay/validation'
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
    )
    return handler
  }

  validate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint): StakeHandler {
    const handler: ValidationHandler = new ValidationHandler()
    void handler.execute(
      this.provider,
      this.wallet,
      new Validator(new NodeId(nodeId), startTime, endTime, amount)
    )
    return handler
  }

  pendingRewards (): Stakes {
    const rewards: Stakes = new Stakes()
    void this.fetchRewards(rewards)
    return rewards
  }

  async fetchRewards (stakes: Stakes): Promise<void> {
    const address: Address = new Address(this.wallet.getAddress(this.provider.mcn.primary.relay))
    const pending: GetPendingValidatorsResponse = await this.provider.relay.getPendingValidators()
    for (let i: number = 0; i < pending.validators.length; i++) {
      const validator: PendingValidator = pending.validators[i]
      const validatorTx: GetTxResponse = await this.provider.relay.getTx(validator.txID)
      const validatorTransaction: AddValidatorTransaction = AddValidatorTransaction.parse(validatorTx.tx)
      const validatorRewards: Secp256k1OutputOwners = validatorTransaction.rewardsOwner
      if (validatorRewards.addresses.length > 0 && address.matches(validatorRewards.addresses[0])) {
        stakes.futureStakes.push(new PendingReward(
          StakeRewardType.Validation,
          this.provider.mcn.primary.relay.assetId,
          validator.txID,
          BigInt(validator.startTime),
          BigInt(validator.endTime),
          BigInt(validator.stakeAmount),
          validator.nodeID,
          validator.connected
        ))
      }
    }
    for (let i: number = 0; i < pending.delegators.length; i++) {
      const delegator: PendingDelegator = pending.delegators[i]
      const transaction: GetTxResponse = await this.provider.relay.getTx(delegator.txID)
      const delegatorTransaction: AddDelegatorTransaction = AddDelegatorTransaction.parse(transaction.tx)
      const delegatorRewards: Secp256k1OutputOwners = delegatorTransaction.rewardsOwner
      if (delegatorRewards.addresses.length > 0 && address.matches(delegatorRewards.addresses[0])) {
        stakes.futureStakes.push(new PendingReward(
          StakeRewardType.Delegation,
          this.provider.mcn.primary.relay.assetId,
          delegator.txID,
          BigInt(delegator.startTime),
          BigInt(delegator.endTime),
          BigInt(delegator.stakeAmount),
          delegator.nodeID,
          true
        ))
      }
    }
    const validators: GetCurrentValidatorsResponse = await this.provider.relay.getCurrentValidators()
    for (let i: number = 0; i < validators.validators.length; i++) {
      const validator: APIValidator = validators.validators[i]
      const validatorTx: GetTxResponse = await this.provider.relay.getTx(validator.txID)
      const validatorTransaction: AddValidatorTransaction = AddValidatorTransaction.parse(validatorTx.tx)
      const validatorRewards: Secp256k1OutputOwners = validatorTransaction.rewardsOwner
      if (validatorRewards.addresses.length > 0 && address.matches(validatorRewards.addresses[0])) {
        stakes.currentStakes.push(new StakeReward(
          StakeRewardType.Validation,
          this.provider.mcn.primary.relay.assetId,
          validator.txID,
          BigInt(validator.startTime),
          BigInt(validator.endTime),
          BigInt(validator.stakeAmount),
          validator.nodeID,
          validator.connected,
          validator.uptime,
          BigInt(validator.potentialReward)
        ))
      }
      if (validator.delegators === null) {
        continue
      }
      for (let j: number = 0; j < validator.delegators.length; j++) {
        const delegator: Delegator = validator.delegators[j]
        const transaction: GetTxResponse = await this.provider.relay.getTx(delegator.txID)
        const delegatorTransaction: AddDelegatorTransaction = AddDelegatorTransaction.parse(transaction.tx)
        const delegatorRewards: Secp256k1OutputOwners = delegatorTransaction.rewardsOwner
        if (delegatorRewards.addresses.length > 0 && address.matches(delegatorRewards.addresses[0])) {
          stakes.currentStakes.push(new StakeReward(
            StakeRewardType.Delegation,
            this.provider.mcn.primary.relay.assetId,
            delegator.txID,
            BigInt(delegator.startTime),
            BigInt(delegator.endTime),
            BigInt(delegator.stakeAmount),
            delegator.nodeID,
            validator.connected,
            validator.uptime,
            BigInt(delegator.potentialReward)
          ))
        }
      }
    }
    stakes.fetched = true
  }
}

export enum StakeRewardType {
  Validation = 'Validation',
  Delegation = 'Delegation'
}

export class Stakes {
  fetched: boolean = false
  futureStakes: PendingReward[] = []
  currentStakes: StakeReward[] = []
}

export class PendingReward {
  stakeType: string
  assetId: string
  transactionId: string
  startTime: bigint
  endTime: bigint
  stakeAmount: bigint
  nodeId: string
  nodeConnected: boolean

  constructor (stakeType: string, assetId: string, transactionId: string, startTime: bigint,
    endTime: bigint, stakeAmount: bigint, nodeId: string, nodeConnected: boolean) {
    this.stakeType = stakeType
    this.assetId = assetId
    this.transactionId = transactionId
    this.startTime = startTime
    this.endTime = endTime
    this.stakeAmount = stakeAmount
    this.nodeId = nodeId
    this.nodeConnected = nodeConnected
  }
}

export class StakeReward extends PendingReward {
  nodeUptime: string
  potentialReward: bigint

  constructor (stakeType: string, assetId: string, transactionId: string, startTime: bigint, endTime: bigint,
    stakeAmount: bigint, nodeId: string, nodeConnected: boolean, nodeUptime: string, potentialReward: bigint) {
    super(stakeType, assetId, transactionId, startTime, endTime, stakeAmount, nodeId, nodeConnected)
    this.nodeUptime = nodeUptime
    this.potentialReward = potentialReward
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
    ).signTransaction([relayWallet]).toCHex()
    const transactionId = (await provider.relay.issueTx(addDelegatorTransaction)).txID
    this.receipt.transactionId = transactionId
    this.receipt.transactionStatus = RelayTransactionStatus.Unknown
    const transactionStatus: string = await new RelayTransactionStatusFetcher(provider.relay,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    this.receipt.transactionStatus = transactionStatus
  }
}

export class ValidationHandler implements ExecutableStakeHandler {
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
    const addValidatorTransaction: string = buildAddValidatorTransaction(
      utxoSet, senders, fee, relay, validator.nodeId, validator.startTime, validator.endTime, validator.weight,
      relay.assetId, ValidationShare, relayWallet.getAddress(), relayWallet.getAddress(), provider.mcn.id
    ).signTransaction([relayWallet]).toCHex()
    const transactionId = (await provider.relay.issueTx(addValidatorTransaction)).txID
    this.receipt.transactionId = transactionId
    this.receipt.transactionStatus = RelayTransactionStatus.Unknown
    const transactionStatus: string = await new RelayTransactionStatusFetcher(provider.relay,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    this.receipt.transactionStatus = transactionStatus
  }
}
