import { type PlatformAPI } from '../../api'
import { type PlatformBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { Validator, type Utxo, fetchUtxos, type UnsignedTransaction, buildAddValidatorTransaction, buildAddDelegatorTransaction, NodeId } from '../../transaction'
import { type PlatformAccount } from '../account'
import { MCNOperationSummary } from '../operation'
import { type DelegateOperation, StakeManager, StakingOperationSummary, type ValidateOperation, ValidationShare } from '../stake'
import { type VMWallet, type JuneoWallet } from '../wallet'
import { FeeData, FeeType } from './fee'
import { Spending } from './transaction'
import { UtxoFeeData, UtxoSpending } from './utxo'

async function getPlatformAddValidatorFee (provider: MCNProvider): Promise<FeeData> {
  const fee: bigint = BigInt((await provider.getFees()).addPrimaryNetworkValidatorFee)
  return new FeeData(provider.platform.chain, fee, FeeType.ValidateFee)
}

async function getPlatformAddDelegatorFee (provider: MCNProvider): Promise<FeeData> {
  const fee: bigint = BigInt((await provider.getFees()).addPrimaryNetworkDelegatorFee)
  return new FeeData(provider.platform.chain, fee, FeeType.DelegateFee)
}

export async function estimatePlatformAddValidatorTransaction (provider: MCNProvider, wallet: VMWallet, validator: Validator, share: number, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
  const api: PlatformAPI = provider.platform
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [wallet.getAddress()])
  }
  const fee: FeeData = await getPlatformAddValidatorFee(provider)
  const transaction: UnsignedTransaction = buildAddValidatorTransaction(
    utxoSet, [wallet.getAddress()], fee.amount, api.chain, validator.nodeId, validator.startTime, validator.endTime, validator.weight,
    api.chain.assetId, share, wallet.getAddress(), wallet.getAddress(), provider.mcn.id
  )
  return UtxoFeeData.from(fee, transaction)
}

export async function estimatePlatformValidateOperation (provider: MCNProvider, wallet: JuneoWallet, validate: ValidateOperation, account: PlatformAccount): Promise<MCNOperationSummary> {
  const chain: PlatformBlockchain = provider.platform.chain
  const potentialReward: bigint = StakeManager.estimateValidationReward(validate.endTime - validate.startTime, validate.amount)
  const validator: Validator = new Validator(new NodeId(validate.nodeId), validate.startTime, validate.endTime, validate.amount)
  return await estimatePlatformAddValidatorTransaction(provider, wallet.getWallet(chain), validator, ValidationShare, account.utxoSet).then(fee => {
    return new StakingOperationSummary(validate, chain, [fee],
      [new UtxoSpending(chain.id, validate.amount, chain.assetId, account.getTransactionUtxos(fee.transaction)), fee], potentialReward
    )
  }, async () => {
    const fee: FeeData = await getPlatformAddValidatorFee(provider)
    return new MCNOperationSummary(validate, chain, [fee], [new Spending(chain.id, validate.amount, chain.assetId), fee])
  })
}

export async function estimatePlatformAddDelegatorTransaction (provider: MCNProvider, wallet: VMWallet, validator: Validator, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
  const api: PlatformAPI = provider.platform
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [wallet.getAddress()])
  }
  const fee: FeeData = await getPlatformAddDelegatorFee(provider)
  const transaction: UnsignedTransaction = buildAddDelegatorTransaction(
    utxoSet, [wallet.getAddress()], fee.amount, api.chain, validator.nodeId, validator.startTime, validator.endTime, validator.weight,
    api.chain.assetId, wallet.getAddress(), wallet.getAddress(), provider.mcn.id
  )
  return UtxoFeeData.from(fee, transaction)
}

export async function estimatePlatformDelegateOperation (provider: MCNProvider, wallet: JuneoWallet, delegate: DelegateOperation, account: PlatformAccount): Promise<MCNOperationSummary> {
  const chain: PlatformBlockchain = provider.platform.chain
  const potentialReward: bigint = StakeManager.estimateDelegationReward(delegate.endTime - delegate.startTime, delegate.amount)
  const validator: Validator = new Validator(new NodeId(delegate.nodeId), delegate.startTime, delegate.endTime, delegate.amount)
  return await estimatePlatformAddDelegatorTransaction(provider, wallet.getWallet(chain), validator, account.utxoSet).then(fee => {
    return new StakingOperationSummary(delegate, chain, [fee],
      [new UtxoSpending(chain.id, delegate.amount, chain.assetId, account.getTransactionUtxos(fee.transaction)), fee], potentialReward
    )
  }, async () => {
    const fee: FeeData = await getPlatformAddDelegatorFee(provider)
    return new MCNOperationSummary(delegate, chain, [fee], [new Spending(chain.id, delegate.amount, chain.assetId), fee])
  })
}
