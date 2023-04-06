import { type GetTxResponse } from '../api/data'
import { type GetCurrentValidatorsResponse, type Validator as APIValidator, type Delegator } from '../api/relay/data'
import { type RelayBlockchain } from '../chain'
import { type JuneoWallet, type MCNProvider } from '../juneo'
import { parseUtxoSet } from '../transaction/builder'
import { Address, NodeId } from '../transaction/types'
import { type Utxo } from '../transaction/utxo'
import { buildAddDelegatorTransaction, buildAddValidatorTransaction } from '../transaction/relay/builder'
import { AddDelegatorTransaction, AddValidatorTransaction, RelayTransactionStatus, RelayTransactionStatusFetcher } from '../transaction/relay/transaction'
import { type Secp256k1OutputOwners, Validator } from '../transaction/relay/validation'
import { TransactionReceipt } from './transfer'
import { type VMWallet } from './wallet'

const StatusFetcherDelay: number = 100
const StatusFetcherMaxAttempts: number = 600
const ValidationShare: number = 120000

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

  validate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint): StakeHandler {
    const handler: ValidationHandler = new ValidationHandler()
    void handler.execute(
      this.provider,
      this.wallet,
      new Validator(new NodeId(nodeId), startTime, endTime, amount)
    )
    return handler
  }

  async pendingRewards (): Promise<StakeReward[]> {
    const address: Address = new Address(this.wallet.getAddress(this.provider.mcn.primary.relay))
    const stakeRewards: StakeReward[] = []
    const validators: GetCurrentValidatorsResponse = await this.provider.relay.getCurrentValidators()
    for (let i: number = 0; i < validators.validators.length; i++) {
      const validator: APIValidator = validators.validators[i]
      const validatorTx: GetTxResponse = await this.provider.relay.getTx(validator.txID)
      const validatorTransaction: AddValidatorTransaction = AddValidatorTransaction.parse(validatorTx.tx)
      const validatorRewards: Secp256k1OutputOwners = validatorTransaction.rewardsOwner
      if (validatorRewards.addresses.length > 0 && address.matches(validatorRewards.addresses[0])) {
        stakeRewards.push(new StakeReward(
          StakeRewardType.Validation,
          this.provider.mcn.primary.relay.assetId,
          validator.txID,
          BigInt(validator.startTime),
          BigInt(validator.endTime),
          BigInt(validator.stakeAmount),
          validator.nodeID,
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
          stakeRewards.push(new StakeReward(
            StakeRewardType.Delegation,
            this.provider.mcn.primary.relay.assetId,
            delegator.txID,
            BigInt(delegator.startTime),
            BigInt(delegator.endTime),
            BigInt(delegator.stakeAmount),
            delegator.nodeID,
            BigInt(delegator.potentialReward)
          ))
        }
      }
    }
    return stakeRewards
  }
}

export enum StakeRewardType {
  Validation = 'Validation',
  Delegation = 'Delegation'
}

export class StakeReward {
  stakeType: string
  assetId: string
  transactionId: string
  startTime: bigint
  endTime: bigint
  stakeAmount: bigint
  nodeId: string
  potentialReward: bigint

  constructor (stakeType: string, assetId: string, transactionId: string, startTime: bigint,
    endTime: bigint, stakeAmount: bigint, nodeId: string, potentialReward: bigint) {
    this.stakeType = stakeType
    this.assetId = assetId
    this.transactionId = transactionId
    this.startTime = startTime
    this.endTime = endTime
    this.stakeAmount = stakeAmount
    this.nodeId = nodeId
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
