import { type PlatformAPI } from '../../api'
import { type Blockchain, type PlatformBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import {
  Validator, type Utxo, fetchUtxos, type UnsignedTransaction, buildAddValidatorTransaction, buildAddDelegatorTransaction,
  NodeId, buildPlatformExportTransaction, UserInput, buildPlatformImportTransaction
} from '../../transaction'
import { getUtxosAmountValues, getImportUserInputs } from '../../utils'
import { type PlatformAccount } from '../account'
import { ChainOperationSummary, type DelegateOperation, StakingOperationSummary, type ValidateOperation } from '../operation'
import { StakeManager, ValidationShare } from '../stake'
import { type VMWallet, type MCNWallet } from '../wallet'
import { BaseFeeData, type FeeData, FeeType, UtxoFeeData } from './fee'
import { BaseSpending, UtxoSpending } from './transaction'

async function getPlatformBaseTxFee (provider: MCNProvider, type: FeeType): Promise<BaseFeeData> {
  return new BaseFeeData(provider.platform.chain, BigInt((await provider.info.getTxFee()).txFee), type)
}

async function getPlatformAddValidatorFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.getFees()).addPrimaryNetworkValidatorFee)
  return new BaseFeeData(provider.platform.chain, fee, FeeType.ValidateFee)
}

async function getPlatformAddDelegatorFee (provider: MCNProvider): Promise<BaseFeeData> {
  const fee: bigint = BigInt((await provider.getFees()).addPrimaryNetworkDelegatorFee)
  return new BaseFeeData(provider.platform.chain, fee, FeeType.DelegateFee)
}

export async function estimatePlatformAddValidatorTransaction (provider: MCNProvider, wallet: VMWallet, validator: Validator, share: number, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
  const api: PlatformAPI = provider.platform
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [wallet.getAddress()])
  }
  const fee: BaseFeeData = await getPlatformAddValidatorFee(provider)
  const transaction: UnsignedTransaction = buildAddValidatorTransaction(
    utxoSet, [wallet.getAddress()], fee.amount, api.chain, validator.nodeId, validator.startTime, validator.endTime, validator.weight,
    api.chain.assetId, share, wallet.getAddress(), wallet.getAddress(), provider.mcn.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimatePlatformValidateOperation (provider: MCNProvider, wallet: MCNWallet, validate: ValidateOperation, account: PlatformAccount): Promise<ChainOperationSummary> {
  const chain: PlatformBlockchain = provider.platform.chain
  const potentialReward: bigint = StakeManager.estimateValidationReward(validate.endTime - validate.startTime, validate.amount)
  const validator: Validator = new Validator(new NodeId(validate.nodeId), validate.startTime, validate.endTime, validate.amount)
  const values = new Map<string, bigint>()
  return await estimatePlatformAddValidatorTransaction(provider, wallet.getWallet(chain), validator, ValidationShare, account.utxoSet)
    .then(fee => {
      const spending: UtxoSpending = new UtxoSpending(chain, validate.amount, chain.assetId, fee.transaction.getUtxos())
      return new StakingOperationSummary(
        validate, chain, fee, [spending, fee.getAsSpending()], values, potentialReward
      )
    }, async () => {
      const fee: BaseFeeData = await getPlatformAddValidatorFee(provider)
      return new ChainOperationSummary(
        validate, chain, fee, [new BaseSpending(chain, validate.amount, chain.assetId), fee.getAsSpending()], values
      )
    })
}

export async function estimatePlatformAddDelegatorTransaction (provider: MCNProvider, wallet: VMWallet, validator: Validator, utxoSet?: Utxo[]): Promise<UtxoFeeData> {
  const api: PlatformAPI = provider.platform
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [wallet.getAddress()])
  }
  const fee: BaseFeeData = await getPlatformAddDelegatorFee(provider)
  const transaction: UnsignedTransaction = buildAddDelegatorTransaction(
    utxoSet, [wallet.getAddress()], fee.amount, api.chain, validator.nodeId, validator.startTime, validator.endTime, validator.weight,
    api.chain.assetId, wallet.getAddress(), wallet.getAddress(), provider.mcn.id
  )
  return new UtxoFeeData(fee.chain, fee.amount, fee.type, transaction)
}

export async function estimatePlatformDelegateOperation (provider: MCNProvider, wallet: MCNWallet, delegate: DelegateOperation, account: PlatformAccount): Promise<ChainOperationSummary> {
  const chain: PlatformBlockchain = provider.platform.chain
  const potentialReward: bigint = StakeManager.estimateDelegationReward(delegate.endTime - delegate.startTime, delegate.amount)
  const validator: Validator = new Validator(new NodeId(delegate.nodeId), delegate.startTime, delegate.endTime, delegate.amount)
  const values = new Map<string, bigint>()
  return await estimatePlatformAddDelegatorTransaction(provider, wallet.getWallet(chain), validator, account.utxoSet)
    .then(fee => {
      const spending: UtxoSpending = new UtxoSpending(chain, delegate.amount, chain.assetId, fee.transaction.getUtxos())
      return new StakingOperationSummary(delegate, chain, fee, [spending, fee.getAsSpending()], values, potentialReward
      )
    }, async () => {
      const fee: BaseFeeData = await getPlatformAddDelegatorFee(provider)
      return new ChainOperationSummary(
        delegate, chain, fee, [new BaseSpending(chain, delegate.amount, chain.assetId), fee.getAsSpending()], values
      )
    })
}

export async function estimatePlatformExportTransaction (provider: MCNProvider): Promise<BaseFeeData> {
  return await getPlatformBaseTxFee(provider, FeeType.ExportFee)
}

export async function sendPlatformExportTransaction (
  provider: MCNProvider, wallet: MCNWallet, destination: Blockchain, assetId: string, amount: bigint, address: string,
  sendImportFee: boolean, importFee: bigint, fee?: FeeData, utxoSet?: Utxo[]
): Promise<string> {
  const api: PlatformAPI = provider.platform
  const sender: string = wallet.getAddress(api.chain)
  if (typeof utxoSet === 'undefined') {
    utxoSet = await fetchUtxos(api, [sender])
  }
  if (typeof fee === 'undefined') {
    fee = await estimatePlatformExportTransaction(provider)
  }
  const exportAddress: string = wallet.getWallet(destination).getJuneoAddress()
  const transaction: UnsignedTransaction = buildPlatformExportTransaction([new UserInput(assetId, api.chain, amount, address, destination)],
    utxoSet, [sender], exportAddress, fee.amount, sendImportFee ? importFee : BigInt(0), sender, provider.mcn.id, api.chain.id
  )
  return (await api.issueTx(transaction.signTransaction([wallet.getWallet(api.chain)]).toCHex())).txID
}

export async function estimatePlatformImportTransaction (provider: MCNProvider): Promise<BaseFeeData> {
  return await getPlatformBaseTxFee(provider, FeeType.ImportFee)
}

export async function sendPlatformImportTransaction (
  provider: MCNProvider, wallet: MCNWallet, source: Blockchain, payImportFee: boolean, fee?: FeeData, utxoSet?: Utxo[]
): Promise<string> {
  const api: PlatformAPI = provider.platform
  const sender: string = wallet.getAddress(api.chain)
  const fetchUtxoSet: boolean = typeof utxoSet === 'undefined'
  if (typeof utxoSet === 'undefined') {
    // put import utxos first to priorize usage of imported inputs
    utxoSet = await fetchUtxos(api, [sender], source.id)
  }
  const values: Map<string, bigint> = getUtxosAmountValues(utxoSet, source.id)
  if (fetchUtxoSet && payImportFee) {
    // also fetching utxos in chain that could be needed if import fee
    // was expected to be paid in destination chain during export
    utxoSet = utxoSet.concat(await fetchUtxos(api, [sender]))
  }
  if (typeof fee === 'undefined') {
    fee = await estimatePlatformImportTransaction(provider)
  }
  const inputs: UserInput[] = getImportUserInputs(values, fee.assetId, fee.amount, source, api.chain, sender)
  const transaction: UnsignedTransaction = buildPlatformImportTransaction(inputs, utxoSet, [sender], fee.amount, sender, provider.mcn.id)
  return (await api.issueTx(transaction.signTransaction([wallet.getWallet(api.chain)]).toCHex())).txID
}
