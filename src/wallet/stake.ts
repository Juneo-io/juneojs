import { type MCNProvider } from '../juneo'
import { type MCNOperation, MCNOperationType, MCNOperationSummary } from './operation'
import { NodeId, fetchUtxos, type Utxo, Validator, buildAddDelegatorTransaction, buildAddValidatorTransaction } from '../transaction'
import { FeeData, FeeType } from './fee'
import { type JuneoWallet, type VMWallet } from './wallet'
import { calculatePrimary, now } from '../utils'
import { type PlatformAPI } from '../api'
import { type PlatformBlockchain } from '../chain'
import { type Spending } from './common'

const ValidationShare: number = 12_0000 // 12%
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

  static from (provider: MCNProvider, wallet: JuneoWallet): StakeManager {
    return new StakeManager(provider, wallet.getWallet(provider.platform.chain))
  }

  estimateValidationReward (stakePeriod: bigint, stakeAmount: bigint): bigint {
    return calculatePrimary(stakePeriod, now(), stakeAmount)
  }

  estimateDelegationReward (stakePeriod: bigint, stakeAmount: bigint): bigint {
    const rewards: bigint = calculatePrimary(stakePeriod, now(), stakeAmount)
    return rewards * BigInt(DelegationShare) / BigInt(BaseShare)
  }

  async estimateValidationFee (): Promise<FeeData> {
    const fee: bigint = BigInt((await this.provider.getFees()).addPrimaryNetworkValidatorFee)
    return new FeeData(this.api.chain, fee, this.api.chain.assetId, FeeType.ValidateFee)
  }

  async estimateDelegationFee (): Promise<FeeData> {
    const fee: bigint = BigInt((await this.provider.getFees()).addPrimaryNetworkDelegatorFee)
    return new FeeData(this.api.chain, fee, this.api.chain.assetId, FeeType.DelegateFee)
  }

  async validate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, feeData?: FeeData, utxoSet?: Utxo[]): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee()
    }
    if (typeof utxoSet === 'undefined') {
      utxoSet = await fetchUtxos(this.api, [this.wallet.getAddress()])
    }
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    const addValidatorTransaction: string = buildAddValidatorTransaction(
      utxoSet, [this.wallet.getAddress()], feeData.amount, this.api.chain, validator.nodeId, validator.startTime, validator.endTime, validator.weight,
      this.api.chain.assetId, ValidationShare, this.wallet.getAddress(), this.wallet.getAddress(), this.provider.mcn.id
    ).signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(addValidatorTransaction).catch(error => {
      throw error
    })).txID
  }

  async delegate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, feeData?: FeeData, utxoSet?: Utxo[]): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee()
    }
    if (typeof utxoSet === 'undefined') {
      utxoSet = await fetchUtxos(this.api, [this.wallet.getAddress()])
    }
    const validator: Validator = new Validator(new NodeId(nodeId), startTime, endTime, amount)
    const addDelegatorTransaction: string = buildAddDelegatorTransaction(
      utxoSet, [this.wallet.getAddress()], feeData.amount, this.api.chain, validator.nodeId, validator.startTime, validator.endTime, validator.weight,
      this.api.chain.assetId, this.wallet.getAddress(), this.wallet.getAddress(), this.provider.mcn.id
    ).signTransaction([this.wallet]).toCHex()
    return (await this.api.issueTx(addDelegatorTransaction).catch(error => {
      throw error
    })).txID
  }
}

abstract class Staking implements MCNOperation {
  type: MCNOperationType
  nodeId: string
  amount: bigint
  startTime: bigint
  endTime: bigint

  constructor (type: MCNOperationType, nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    this.type = type
    this.nodeId = nodeId
    this.amount = amount
    this.startTime = startTime
    this.endTime = endTime
  }
}

export class ValidateOperation extends Staking {
  constructor (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(MCNOperationType.Validate, nodeId, amount, startTime, endTime)
  }
}

export class DelegateOperation extends Staking {
  constructor (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(MCNOperationType.Delegate, nodeId, amount, startTime, endTime)
  }
}

export class StakingOperationSummary extends MCNOperationSummary {
  potentialReward: bigint

  constructor (operation: Staking, chain: PlatformBlockchain, fees: FeeData[], spendings: Spending[], potentialReward: bigint) {
    super(operation, chain, fees, spendings)
    this.potentialReward = potentialReward
  }
}
