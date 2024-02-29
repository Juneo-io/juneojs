import { type PlatformAPI } from '../../api'
import { type PlatformBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import {
  Validator,
  type Utxo,
  type UnsignedTransaction,
  buildAddValidatorTransaction,
  buildAddDelegatorTransaction,
  NodeId
} from '../../transaction'
import { type PlatformAccount } from '../account'
import {
  ChainOperationSummary,
  type DelegateOperation,
  StakingOperationSummary,
  type ValidateOperation
} from '../operation'
import { StakeManager, ValidationShare } from '../stake'
import { BaseFeeData, FeeType, UtxoFeeData } from './fee'
import { BaseSpending, UtxoSpending } from './transaction'

async function getPlatformAddValidatorFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.info.getTxFee()).addPrimaryNetworkValidatorFee)
  return new BaseFeeData(provider.platform.chain, fee, FeeType.ValidateFee)
}

async function getPlatformAddDelegatorFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.info.getTxFee()).addPrimaryNetworkDelegatorFee)
  return new BaseFeeData(provider.platform.chain, fee, FeeType.DelegateFee)
}

export async function estimatePlatformAddValidatorTransaction (
  provider: MCNProvider,
  account: PlatformAccount,
  validator: Validator,
  share: number,
  stakeAddresses: string[],
  stakeThreshold: number,
  rewardAddresses: string[],
  rewardThreshold: number,
  utxoSet: Utxo[]
): Promise<UtxoFeeData> {
  const api: PlatformAPI = provider.platform
  const fee: BaseFeeData = await getPlatformAddValidatorFee(provider)
  const transaction: UnsignedTransaction = buildAddValidatorTransaction(
    utxoSet,
    account.getSignersAddresses(),
    fee.amount,
    api.chain,
    validator.nodeId,
    validator.startTime,
    validator.endTime,
    validator.weight,
    api.chain.assetId,
    share,
    stakeAddresses,
    stakeThreshold,
    BigInt(0),
    rewardAddresses,
    rewardThreshold,
    BigInt(0),
    account.address,
    provider.mcn.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimatePlatformValidateOperation (
  provider: MCNProvider,
  validate: ValidateOperation,
  account: PlatformAccount
): Promise<ChainOperationSummary> {
  const chain: PlatformBlockchain = provider.platform.chain
  const potentialReward: bigint = StakeManager.estimateValidationReward(
    validate.endTime - validate.startTime,
    validate.amount
  )
  const validator: Validator = new Validator(
    new NodeId(validate.nodeId),
    validate.startTime,
    validate.endTime,
    validate.amount
  )
  const values = new Map<string, bigint>()
  return await estimatePlatformAddValidatorTransaction(
    provider,
    account,
    validator,
    ValidationShare,
    validate.rewardAddresses,
    validate.threshold,
    account.utxoSet
  ).then(
    (fee) => {
      const spending: UtxoSpending = new UtxoSpending(chain, validate.amount, chain.assetId, fee.transaction.getUtxos())
      return new StakingOperationSummary(validate, chain, fee, [spending, fee.spending], values, potentialReward)
    },
    async () => {
      const fee: BaseFeeData = await getPlatformAddValidatorFee(provider)
      return new ChainOperationSummary(
        validate,
        chain,
        fee,
        [new BaseSpending(chain, validate.amount, chain.assetId), fee.spending],
        values
      )
    }
  )
}

export async function estimatePlatformAddDelegatorTransaction (
  provider: MCNProvider,
  account: PlatformAccount,
  validator: Validator,
  stakeAddresses: string[],
  stakeThreshold: number,
  rewardAddresses: string[],
  rewardThreshold: number,
  utxoSet: Utxo[]
): Promise<UtxoFeeData> {
  const api: PlatformAPI = provider.platform
  const fee: BaseFeeData = await getPlatformAddDelegatorFee(provider)
  const transaction: UnsignedTransaction = buildAddDelegatorTransaction(
    utxoSet,
    account.getSignersAddresses(),
    fee.amount,
    api.chain,
    validator.nodeId,
    validator.startTime,
    validator.endTime,
    validator.weight,
    api.chain.assetId,
    stakeAddresses,
    stakeThreshold,
    BigInt(0),
    rewardAddresses,
    rewardThreshold,
    BigInt(0),
    account.address,
    provider.mcn.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimatePlatformDelegateOperation (
  provider: MCNProvider,
  delegate: DelegateOperation,
  account: PlatformAccount
): Promise<ChainOperationSummary> {
  const chain: PlatformBlockchain = provider.platform.chain
  const potentialReward: bigint = StakeManager.estimateDelegationReward(
    delegate.endTime - delegate.startTime,
    delegate.amount
  )
  const validator: Validator = new Validator(
    new NodeId(delegate.nodeId),
    delegate.startTime,
    delegate.endTime,
    delegate.amount
  )
  const values = new Map<string, bigint>()
  return await estimatePlatformAddDelegatorTransaction(
    provider,
    account,
    validator,
    delegate.rewardAddresses,
    delegate.threshold,
    account.utxoSet
  ).then(
    (fee) => {
      const spending: UtxoSpending = new UtxoSpending(chain, delegate.amount, chain.assetId, fee.transaction.getUtxos())
      return new StakingOperationSummary(delegate, chain, fee, [spending, fee.spending], values, potentialReward)
    },
    async () => {
      const fee: BaseFeeData = await getPlatformAddDelegatorFee(provider)
      return new ChainOperationSummary(
        delegate,
        chain,
        fee,
        [new BaseSpending(chain, delegate.amount, chain.assetId), fee.spending],
        values
      )
    }
  )
}
