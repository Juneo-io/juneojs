import { NodeId, type Utxo, Validator } from '../transaction'
import {
  type UtxoFeeData,
  estimatePlatformAddValidatorTransaction,
  estimatePlatformAddDelegatorTransaction
} from './transaction'
import { type MCNWallet, type VMWallet } from './wallet'
import { StakeError, calculatePrimary, now, verifyTimeRange } from '../utils'
import { type PlatformAPI } from '../api'
import { type StakeConfig } from '../network'
import { type PlatformAccount } from './account'
import { type MCNProvider } from '../juneo'

export const ValidationShare: number = 12_0000 // 12%
const BaseShare: number = 100_0000 // 100%
const DelegationShare: number = BaseShare - ValidationShare

export class StakeManager {
  private readonly provider: MCNProvider
  private readonly api: PlatformAPI
  private readonly wallet: VMWallet

  constructor (provider: MCNProvider, wallet: VMWallet) {
    this.provider = provider
    this.api = provider.platform
    this.wallet = wallet
  }

  static from (provider: MCNProvider, wallet: MCNWallet): StakeManager {
    return new StakeManager(provider, wallet.getWallet(provider.platform.chain))
  }

  static estimateValidationReward (stakePeriod: bigint, stakeAmount: bigint): bigint {
    return calculatePrimary(stakePeriod, now(), stakeAmount)
  }

  static estimateDelegationReward (stakePeriod: bigint, stakeAmount: bigint): bigint {
    const rewards: bigint = calculatePrimary(stakePeriod, now(), stakeAmount)
    return (rewards * BigInt(DelegationShare)) / BigInt(BaseShare)
  }

  static verifyStakingValues (
    amount: bigint,
    minStake: bigint,
    maxStake: bigint,
    startTime: bigint,
    endTime: bigint,
    minPeriod: bigint
  ): void {
    if (amount < minStake) {
      throw new StakeError(`amount ${amount} is less than min stake ${minStake}`)
    }
    if (amount > maxStake) {
      throw new StakeError(`amount ${amount} exceeds max stake ${maxStake}`)
    }
    verifyTimeRange(startTime, endTime, minPeriod)
  }

  static verifyValidationValues (amount: bigint, startTime: bigint, endTime: bigint, config: StakeConfig): void {
    const minStake: bigint = config.minValidatorStake
    const maxStake: bigint = config.maxValidatorStake
    const minPeriod: bigint = config.minStakeDuration
    StakeManager.verifyStakingValues(amount, minStake, maxStake, startTime, endTime, minPeriod)
  }

  static verifyDelegationValues (amount: bigint, startTime: bigint, endTime: bigint, config: StakeConfig): void {
    const minStake: bigint = config.minDelegatorStake
    // this is not a correct max value but can be used for a sanity pre-check
    const maxStake: bigint = config.maxValidatorStake
    const minPeriod: bigint = config.minStakeDuration
    StakeManager.verifyStakingValues(amount, minStake, maxStake, startTime, endTime, minPeriod)
  }

  async estimateValidationFee (
    account: PlatformAccount,
    nodeId: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint,
    rewardAddresses: string[],
    threshold: number,
    utxoSet?: Utxo[]
  ): Promise<UtxoFeeData> {
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    return await estimatePlatformAddValidatorTransaction(
      this.provider,
      account,
      validator,
      ValidationShare,
      rewardAddresses,
      threshold,
      utxoSet
    )
  }

  async estimateDelegationFee (
    account: PlatformAccount,
    nodeId: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint,
    rewardAddresses: string[],
    threshold: number,
    utxoSet?: Utxo[]
  ): Promise<UtxoFeeData> {
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    return await estimatePlatformAddDelegatorTransaction(
      this.provider,
      account,
      validator,
      rewardAddresses,
      threshold,
      utxoSet
    )
  }

  async validate (
    account: PlatformAccount,
    nodeId: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint,
    rewardAddresses: string[],
    threshold: number,
    feeData?: UtxoFeeData,
    utxoSet?: Utxo[]
  ): Promise<string> {
    StakeManager.verifyValidationValues(amount, startTime, endTime, this.provider.mcn.stakeConfig)
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee(
        account,
        nodeId,
        amount,
        startTime,
        endTime,
        rewardAddresses,
        threshold,
        utxoSet
      )
    }
    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(transaction)).txID
  }

  async delegate (
    account: PlatformAccount,
    nodeId: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint,
    rewardAddresses: string[],
    threshold: number,
    feeData?: UtxoFeeData,
    utxoSet?: Utxo[]
  ): Promise<string> {
    StakeManager.verifyDelegationValues(amount, startTime, endTime, this.provider.mcn.stakeConfig)
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee(
        account,
        nodeId,
        amount,
        startTime,
        endTime,
        rewardAddresses,
        threshold,
        utxoSet
      )
    }
    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(transaction)).txID
  }
}
