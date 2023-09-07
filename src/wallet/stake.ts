import { type MCNProvider } from '../juneo'
import { type MCNOperation, MCNOperationType, MCNOperationSummary } from './operation'
import { NodeId, type Utxo, Validator } from '../transaction'
import { type Spending, type UtxoFeeData, estimatePlatformAddValidatorTransaction, estimatePlatformAddDelegatorTransaction } from './transaction'
import { type JuneoWallet, type VMWallet } from './wallet'
import { calculatePrimary, now } from '../utils'
import { type IssueTxResponse, type PlatformAPI } from '../api'
import { type PlatformBlockchain } from '../chain'

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

  static from (provider: MCNProvider, wallet: JuneoWallet): StakeManager {
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

  async validate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, feeData?: UtxoFeeData, utxoSet?: Utxo[]): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee(nodeId, amount, startTime, endTime, utxoSet)
    }
    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    const response: IssueTxResponse = await this.api.issueTx(transaction).catch(error => {
      throw error
    })
    return response.txID
  }

  async delegate (nodeId: string, amount: bigint, startTime: bigint, endTime: bigint, feeData?: UtxoFeeData, utxoSet?: Utxo[]): Promise<string> {
    if (typeof feeData === 'undefined') {
      feeData = await this.estimateValidationFee(nodeId, amount, startTime, endTime, utxoSet)
    }
    const transaction: string = feeData.transaction.signTransaction([this.wallet]).toCHex()
    const response: IssueTxResponse = await this.api.issueTx(transaction).catch(error => {
      throw error
    })
    return response.txID
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

  constructor (operation: Staking, chain: PlatformBlockchain, fees: UtxoFeeData[], spendings: Spending[], potentialReward: bigint) {
    super(operation, [chain], fees, spendings)
    this.potentialReward = potentialReward
  }
}
