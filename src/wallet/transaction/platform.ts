import { type PlatformBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import {
  Address,
  buildAddPermissionlessDelegatorTransaction,
  buildAddPermissionlessValidatorTransaction,
  buildAddSupernetValidatorTransaction,
  buildCreateChainTransaction,
  buildCreateSupernetTransaction,
  buildRemoveSupernetValidatorTransaction,
  CreateSupernetTransaction,
  type DynamicId,
  NodeId,
  PrimarySigner,
  ProofOfPossession,
  type UnsignedTransaction,
  type Utxo,
  Validator
} from '../../transaction'
import { type PlatformAccount } from '../account'
import {
  type AddSupernetValidatorOperation,
  ChainOperationSummary,
  type CreateChainOperation,
  type CreateSupernetOperation,
  type DelegatePrimaryOperation,
  type RemoveSupernetValidatorOperation,
  StakingOperationSummary,
  type ValidatePrimaryOperation
} from '../operation'
import { BaseFeeData, UtxoFeeData } from './fee'
import { BaseSpending, TransactionType, UtxoSpending } from './transaction'

async function getPlatformAddPrimaryValidatorFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.info.getTxFee()).addPrimaryNetworkValidatorFee)
  return new BaseFeeData(provider.platformChain, fee, TransactionType.PrimaryValidation)
}

async function getPlatformAddPrimaryDelegatorFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.info.getTxFee()).addPrimaryNetworkDelegatorFee)
  return new BaseFeeData(provider.platformChain, fee, TransactionType.PrimaryDelegation)
}

async function getPlatformCreateSupernetFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.info.getTxFee()).createSupernetTxFee)
  return new BaseFeeData(provider.platformChain, fee, TransactionType.CreateSupernet)
}

async function getPlatformAddSupernetValidatorFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.info.getTxFee()).addSupernetValidatorFee)
  return new BaseFeeData(provider.platformChain, fee, TransactionType.ValidateSupernet)
}

async function getPlatformRemoveSupernetValidatorFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.info.getTxFee()).txFee)
  return new BaseFeeData(provider.platformChain, fee, TransactionType.RemoveSupernetValidator)
}

async function getPlatformCreateChainFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.info.getTxFee()).createBlockchainTxFee)
  return new BaseFeeData(provider.platformChain, fee, TransactionType.CreateChain)
}

export async function estimatePlatformAddPrimaryValidatorTransaction (
  provider: MCNProvider,
  utxoSet: Utxo[],
  signersAddresses: Address[],
  changeAddress: string,
  validator: Validator,
  share: number,
  pop: ProofOfPossession,
  stakeAddresses: string[],
  stakeThreshold: number,
  rewardAddresses: string[],
  rewardThreshold: number
): Promise<UtxoFeeData> {
  const fee: BaseFeeData = await getPlatformAddPrimaryValidatorFee(provider)
  const transaction: UnsignedTransaction = buildAddPermissionlessValidatorTransaction(
    utxoSet,
    signersAddresses,
    fee.amount,
    provider.platformChain,
    validator.nodeId,
    validator.startTime,
    validator.endTime,
    provider.mcn.primary.id,
    validator.weight,
    provider.juneAssetId,
    share,
    new PrimarySigner(pop),
    stakeAddresses,
    stakeThreshold,
    BigInt(0),
    rewardAddresses,
    rewardThreshold,
    BigInt(0),
    changeAddress,
    provider.mcn.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimatePlatformValidatePrimaryOperation (
  provider: MCNProvider,
  validate: ValidatePrimaryOperation,
  account: PlatformAccount
): Promise<ChainOperationSummary> {
  const chain = provider.platformChain
  const potentialReward = chain.estimatePrimaryValidationReward(validate.endTime - validate.startTime, validate.amount)
  const validator = new Validator(new NodeId(validate.nodeId), validate.startTime, validate.endTime, validate.amount)
  const values = new Map<string, bigint>()
  const fee = await getPlatformAddPrimaryValidatorFee(provider)
  const hasSpending = typeof validate.utxoSet === 'undefined'
  return await estimatePlatformAddPrimaryValidatorTransaction(
    provider,
    validate.getPreferredUtxoSet(account, fee.amount),
    validate.getPreferredSigners(account),
    account.address,
    validator,
    chain.stakeConfig.minDelegationFee, // this is the only value possible for primary network as min = max value
    new ProofOfPossession(validate.publicKey, validate.signature),
    validate.stakeAddresses,
    validate.stakeThreshold,
    validate.rewardAddresses,
    validate.rewardThreshold
  ).then(
    (fee) => {
      const spendings = [fee.spending]
      if (hasSpending) {
        spendings.unshift(new UtxoSpending(chain, validate.amount, chain.assetId, fee.transaction.getUtxos()))
      }
      return new StakingOperationSummary(provider, validate, chain, fee, spendings, values, potentialReward)
    },
    async () => {
      const spendings = [fee.spending]
      if (hasSpending) {
        spendings.unshift(new BaseSpending(chain, validate.amount, chain.assetId))
      }
      return new ChainOperationSummary(provider, validate, chain, fee, spendings, values)
    }
  )
}

export async function estimatePlatformAddPrimaryDelegatorTransaction (
  provider: MCNProvider,
  utxoSet: Utxo[],
  signersAddresses: Address[],
  changeAddress: string,
  validator: Validator,
  stakeAddresses: string[],
  stakeThreshold: number,
  rewardAddresses: string[],
  rewardThreshold: number
): Promise<UtxoFeeData> {
  const fee: BaseFeeData = await getPlatformAddPrimaryDelegatorFee(provider)
  const transaction: UnsignedTransaction = buildAddPermissionlessDelegatorTransaction(
    utxoSet,
    signersAddresses,
    fee.amount,
    provider.platformChain,
    validator.nodeId,
    validator.startTime,
    validator.endTime,
    provider.mcn.primary.id,
    validator.weight,
    provider.juneAssetId,
    stakeAddresses,
    stakeThreshold,
    BigInt(0),
    rewardAddresses,
    rewardThreshold,
    BigInt(0),
    changeAddress,
    provider.mcn.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimatePlatformDelegatePrimaryOperation (
  provider: MCNProvider,
  delegate: DelegatePrimaryOperation,
  account: PlatformAccount
): Promise<ChainOperationSummary> {
  const chain = provider.platformChain
  const potentialReward = chain.estimatePrimaryDelegationReward(delegate.endTime - delegate.startTime, delegate.amount)
  const validator = new Validator(new NodeId(delegate.nodeId), delegate.startTime, delegate.endTime, delegate.amount)
  const values = new Map<string, bigint>()
  const fee = await getPlatformAddPrimaryDelegatorFee(provider)
  const hasSpending = typeof delegate.utxoSet === 'undefined'
  return await estimatePlatformAddPrimaryDelegatorTransaction(
    provider,
    delegate.getPreferredUtxoSet(account, fee.amount),
    delegate.getPreferredSigners(account),
    account.address,
    validator,
    delegate.stakeAddresses,
    delegate.stakeThreshold,
    delegate.rewardAddresses,
    delegate.rewardThreshold
  ).then(
    (fee) => {
      const spendings = [fee.spending]
      if (hasSpending) {
        spendings.unshift(new UtxoSpending(chain, delegate.amount, chain.assetId, fee.transaction.getUtxos()))
      }
      return new StakingOperationSummary(provider, delegate, chain, fee, spendings, values, potentialReward)
    },
    async () => {
      const spendings = [fee.spending]
      if (hasSpending) {
        spendings.unshift(new BaseSpending(chain, delegate.amount, chain.assetId))
      }
      return new ChainOperationSummary(provider, delegate, chain, fee, spendings, values)
    }
  )
}

export async function estimatePlatformCreateSupernetTransaction (
  provider: MCNProvider,
  account: PlatformAccount,
  supernetAuthAddresses: string[],
  supernetAuthThreshold: number
): Promise<UtxoFeeData> {
  const fee: BaseFeeData = await getPlatformCreateSupernetFee(provider)
  const transaction: UnsignedTransaction = buildCreateSupernetTransaction(
    account.utxoSet,
    Address.toAddresses(account.getSignersAddresses()),
    fee.amount,
    provider.platformChain,
    supernetAuthAddresses,
    supernetAuthThreshold,
    account.address,
    provider.mcn.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimatePlatformCreateSupernetOperation (
  provider: MCNProvider,
  createSupernet: CreateSupernetOperation,
  account: PlatformAccount
): Promise<ChainOperationSummary> {
  const chain: PlatformBlockchain = provider.platformChain
  const values = new Map<string, bigint>()
  return await estimatePlatformCreateSupernetTransaction(
    provider,
    account,
    createSupernet.supernetAuthAddresses,
    createSupernet.supernetAuthThreshold
  ).then(
    (fee) => {
      return new ChainOperationSummary(provider, createSupernet, chain, fee, [fee.spending], values)
    },
    async () => {
      const fee: BaseFeeData = await getPlatformCreateSupernetFee(provider)
      return new ChainOperationSummary(provider, createSupernet, chain, fee, [fee.spending], values)
    }
  )
}

export async function estimatePlatformAddSupernetValidatorTransaction (
  provider: MCNProvider,
  account: PlatformAccount,
  supernetId: string,
  validator: Validator
): Promise<UtxoFeeData> {
  const fee: BaseFeeData = await getPlatformAddSupernetValidatorFee(provider)
  const createSupernetTx: CreateSupernetTransaction = CreateSupernetTransaction.parse(
    (await provider.platformApi.getTx(supernetId)).tx
  )
  const transaction: UnsignedTransaction = buildAddSupernetValidatorTransaction(
    account.utxoSet,
    Address.toAddresses(account.getSignersAddresses()),
    fee.amount,
    provider.platformChain,
    validator.nodeId,
    validator.startTime,
    validator.endTime,
    validator.weight,
    supernetId,
    createSupernetTx.getSupernetAuth(Address.toAddresses(account.getSignersAddresses())),
    account.address,
    provider.mcn.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimatePlatformAddSupernetValidatorOperation (
  provider: MCNProvider,
  addValidator: AddSupernetValidatorOperation,
  account: PlatformAccount
): Promise<ChainOperationSummary> {
  const chain: PlatformBlockchain = provider.platformChain
  const validator: Validator = new Validator(
    new NodeId(addValidator.nodeId),
    addValidator.startTime,
    addValidator.endTime,
    addValidator.amount
  )
  const values = new Map<string, bigint>()
  return await estimatePlatformAddSupernetValidatorTransaction(
    provider,
    account,
    addValidator.supernetId,
    validator
  ).then(
    (fee) => {
      return new ChainOperationSummary(provider, addValidator, chain, fee, [fee.spending], values)
    },
    async () => {
      const fee: BaseFeeData = await getPlatformAddSupernetValidatorFee(provider)
      return new ChainOperationSummary(provider, addValidator, chain, fee, [fee.spending], values)
    }
  )
}

export async function estimatePlatformRemoveSupernetValidatorTransaction (
  provider: MCNProvider,
  account: PlatformAccount,
  supernetId: string,
  nodeId: string
): Promise<UtxoFeeData> {
  const fee: BaseFeeData = await getPlatformRemoveSupernetValidatorFee(provider)
  const createSupernetTx: CreateSupernetTransaction = CreateSupernetTransaction.parse(
    (await provider.platformApi.getTx(supernetId)).tx
  )
  const transaction: UnsignedTransaction = buildRemoveSupernetValidatorTransaction(
    account.utxoSet,
    Address.toAddresses(account.getSignersAddresses()),
    fee.amount,
    provider.platformChain,
    nodeId,
    supernetId,
    createSupernetTx.getSupernetAuth(Address.toAddresses(account.getSignersAddresses())),
    account.address,
    provider.mcn.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimatePlatformRemoveSupernetValidatorOperation (
  provider: MCNProvider,
  removeValidator: RemoveSupernetValidatorOperation,
  account: PlatformAccount
): Promise<ChainOperationSummary> {
  const chain: PlatformBlockchain = provider.platformChain
  const values = new Map<string, bigint>()
  return await estimatePlatformRemoveSupernetValidatorTransaction(
    provider,
    account,
    removeValidator.supernetId,
    removeValidator.nodeId
  ).then(
    (fee) => {
      return new ChainOperationSummary(provider, removeValidator, chain, fee, [fee.spending], values)
    },
    async () => {
      const fee: BaseFeeData = await getPlatformRemoveSupernetValidatorFee(provider)
      return new ChainOperationSummary(provider, removeValidator, chain, fee, [fee.spending], values)
    }
  )
}

export async function estimatePlatformCreateChainTransaction (
  provider: MCNProvider,
  account: PlatformAccount,
  supernetId: string,
  chainName: string,
  vmId: DynamicId,
  genesisData: string,
  chainAssetId: string,
  fxIds: DynamicId[]
): Promise<UtxoFeeData> {
  const fee: BaseFeeData = await getPlatformCreateChainFee(provider)
  const createSupernetTx: CreateSupernetTransaction = CreateSupernetTransaction.parse(
    (await provider.platformApi.getTx(supernetId)).tx
  )
  const transaction: UnsignedTransaction = buildCreateChainTransaction(
    account.utxoSet,
    Address.toAddresses(account.getSignersAddresses()),
    fee.amount,
    provider.platformChain,
    supernetId,
    chainName,
    chainAssetId,
    vmId,
    fxIds,
    genesisData,
    createSupernetTx.getSupernetAuth(Address.toAddresses(account.getSignersAddresses())),
    account.address,
    provider.mcn.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimatePlatformCreateChainOperation (
  provider: MCNProvider,
  createChain: CreateChainOperation,
  account: PlatformAccount
): Promise<ChainOperationSummary> {
  const chain: PlatformBlockchain = provider.platformChain
  const values = new Map<string, bigint>()
  return await estimatePlatformCreateChainTransaction(
    provider,
    account,
    createChain.supernetId,
    createChain.chainName,
    createChain.vmId,
    createChain.genesisData,
    createChain.chainAssetId,
    createChain.fxIds
  ).then(
    (fee) => {
      return new ChainOperationSummary(provider, createChain, chain, fee, [fee.spending], values)
    },
    async () => {
      const fee: BaseFeeData = await getPlatformCreateChainFee(provider)
      return new ChainOperationSummary(provider, createChain, chain, fee, [fee.spending], values)
    }
  )
}
