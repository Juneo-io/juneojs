import { type PlatformAPI } from '../../api'
import { type PlatformBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import {
  Validator,
  type Utxo,
  type UnsignedTransaction,
  NodeId,
  buildAddPermissionlessValidatorTransaction,
  ProofOfPossession,
  PrimarySigner,
  buildAddPermissionlessDelegatorTransaction
} from '../../transaction'
import { type PlatformAccount } from '../account'
import {
  ChainOperationSummary,
  type DelegatePrimaryOperation,
  StakingOperationSummary,
  type ValidatePrimaryOperation
} from '../operation'
import { StakeManager, ValidationShare } from '../stake'
import { BaseFeeData, FeeType, UtxoFeeData } from './fee'
import { BaseSpending, UtxoSpending } from './transaction'

async function getPlatformAddPrimaryValidatorFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.info.getTxFee()).addPrimaryNetworkValidatorFee)
  return new BaseFeeData(provider.platform.chain, fee, FeeType.ValidateFee)
}

async function getPlatformAddPrimaryDelegatorFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.info.getTxFee()).addPrimaryNetworkDelegatorFee)
  return new BaseFeeData(provider.platform.chain, fee, FeeType.DelegateFee)
}

export async function estimatePlatformAddPrimaryValidatorTransaction (
  provider: MCNProvider,
  account: PlatformAccount,
  validator: Validator,
  share: number,
  pop: ProofOfPossession,
  stakeAddresses: string[],
  stakeThreshold: number,
  rewardAddresses: string[],
  rewardThreshold: number,
  utxoSet: Utxo[]
): Promise<UtxoFeeData> {
  const api: PlatformAPI = provider.platform
  const fee: BaseFeeData = await getPlatformAddPrimaryValidatorFee(provider)
  const transaction: UnsignedTransaction = buildAddPermissionlessValidatorTransaction(
    utxoSet,
    account.getSignersAddresses(),
    fee.amount,
    api.chain,
    validator.nodeId,
    validator.startTime,
    validator.endTime,
    provider.mcn.primary.id,
    validator.weight,
    api.chain.assetId,
    share,
    new PrimarySigner(pop),
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

export async function estimatePlatformValidatePrimaryOperation (
  provider: MCNProvider,
  validate: ValidatePrimaryOperation,
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
  return await estimatePlatformAddPrimaryValidatorTransaction(
    provider,
    account,
    validator,
    ValidationShare,
    new ProofOfPossession(validate.publicKey, validate.signature),
    validate.stakeAddresses,
    validate.stakeThreshold,
    validate.rewardAddresses,
    validate.rewardThreshold,
    account.utxoSet
  ).then(
    (fee) => {
      const spending: UtxoSpending = new UtxoSpending(chain, validate.amount, chain.assetId, fee.transaction.getUtxos())
      return new StakingOperationSummary(validate, chain, fee, [spending, fee.spending], values, potentialReward)
    },
    async () => {
      const fee: BaseFeeData = await getPlatformAddPrimaryValidatorFee(provider)
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

export async function estimatePlatformAddPrimaryDelegatorTransaction (
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
  const fee: BaseFeeData = await getPlatformAddPrimaryDelegatorFee(provider)
  const transaction: UnsignedTransaction = buildAddPermissionlessDelegatorTransaction(
    utxoSet,
    account.getSignersAddresses(),
    fee.amount,
    api.chain,
    validator.nodeId,
    validator.startTime,
    validator.endTime,
    provider.mcn.primary.id,
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

export async function estimatePlatformDelegatePrimaryOperation (
  provider: MCNProvider,
  delegate: DelegatePrimaryOperation,
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
  return await estimatePlatformAddPrimaryDelegatorTransaction(
    provider,
    account,
    validator,
    delegate.stakeAddresses,
    delegate.stakeThreshold,
    delegate.rewardAddresses,
    delegate.rewardThreshold,
    account.utxoSet
  ).then(
    (fee) => {
      const spending: UtxoSpending = new UtxoSpending(chain, delegate.amount, chain.assetId, fee.transaction.getUtxos())
      return new StakingOperationSummary(delegate, chain, fee, [spending, fee.spending], values, potentialReward)
    },
    async () => {
      const fee: BaseFeeData = await getPlatformAddPrimaryDelegatorFee(provider)
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
