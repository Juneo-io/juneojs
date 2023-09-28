import { NetworkOperationType, ChainNetworkOperation } from './operation'
import { NodeId, type Utxo, Validator } from '../transaction'
import { type UtxoFeeData, estimatePlatformAddValidatorTransaction, estimatePlatformAddDelegatorTransaction } from './transaction'
import { type MCNWallet, type VMWallet } from './wallet'
import { WalletError, calculatePrimary, now } from '../utils'
import { type PlatformAPI } from '../api'
import { type MCN } from '../chain'
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
    return rewards * BigInt(DelegationShare) / BigInt(BaseShare)
  }

  async estimateValidationFee (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    return await estimatePlatformAddValidatorTransaction(this.provider, this.wallet, validator, ValidationShare, utxoSet)
  }

  async estimateDelegationFee (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    return await estimatePlatformAddDelegatorTransaction(this.provider, this.wallet, validator, utxoSet)
  }

  private checkTimeValidity (startTime: bigint, endTime: bigint): void {
    if (startTime < now()) {
      throw new WalletError('Stake start time must be in the future')
    }
    if (endTime <= startTime) {
      throw new WalletError('Stake end time must be after start time')
    }
  }

  async validate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, feeData?: UtxoFeeData, utxoSet?: Utxo[]): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee(nodeId, amount, startTime, endTime, utxoSet)
    }
    // check if the time is valid
    this.checkTimeValidity(startTime, endTime)
    if (endTime - startTime < this.provider.mcn.stakeConfig.minStakeDuration) {
      throw new WalletError(`Stake duration must be at least ${this.provider.mcn.stakeConfig.minStakeDuration} seconds`)
    }
    const minStake: bigint = this.provider.mcn.stakeConfig.minValidatorStake
    const maxStake: bigint = this.provider.mcn.stakeConfig.maxValidatorStake
    if (amount > maxStake) {
      throw new WalletError(`Stake amount ${amount} exceeds max stake ${maxStake}`)
    }
    if (amount < minStake) {
      throw new WalletError(`Stake amount ${amount} is less than min stake ${minStake}`)
    }
    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(transaction)).txID
  }

  async delegate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, feeData?: UtxoFeeData, utxoSet?: Utxo[]): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee(nodeId, amount, startTime, endTime, utxoSet)
    }
    // check if node already validate (must be true)
    this.checkTimeValidity(startTime, endTime)
    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(transaction)).txID
  }
}

export abstract class Staking extends ChainNetworkOperation {
  nodeId: string
  amount: bigint
  startTime: bigint
  endTime: bigint

  constructor (type: NetworkOperationType, mcn: MCN, nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(type, mcn.primary.platform)
    this.nodeId = nodeId
    this.amount = amount
    this.startTime = startTime
    this.endTime = endTime
  }
}

export class ValidateOperation extends Staking {
  constructor (mcn: MCN, nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(NetworkOperationType.Validate, mcn, nodeId, amount, startTime, endTime)
  }
}

export class DelegateOperation extends Staking {
  constructor (mcn: MCN, nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(NetworkOperationType.Delegate, mcn, nodeId, amount, startTime, endTime)
  }
}
