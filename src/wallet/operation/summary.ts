import { type Blockchain, type PlatformBlockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { type Utxo } from '../../transaction'
import { type EVMFeeData, type FeeData, type Spending, type UtxoFeeData } from '../transaction'
import { ExecutableOperation } from './executable'
import {
  type ChainNetworkOperation,
  type CrossOperation,
  type CrossResumeOperation,
  type DepositResumeOperation,
  type NetworkOperation,
  type Staking
} from './operation'

export interface OperationSummary {
  operation: NetworkOperation
  fees: FeeData[]
  spendings: Spending[]
  values: Map<string, bigint>

  getExecutable: () => ExecutableOperation

  getAssets: () => Set<string>

  getChains: () => Blockchain[]

  getErrors: () => Error[]
}

abstract class AbstractOperationSummary implements OperationSummary {
  operation: NetworkOperation
  fees: FeeData[]
  spendings: Spending[]
  values: Map<string, bigint>
  errors: Error[]
  private readonly executable: ExecutableOperation

  constructor (
    provider: MCNProvider,
    operation: NetworkOperation,
    fees: FeeData[],
    spendings: Spending[],
    values: Map<string, bigint>,
    errors: Error[]
  ) {
    this.operation = operation
    this.fees = fees
    this.spendings = spendings
    this.values = values
    this.executable = new ExecutableOperation(provider)
    this.errors = errors
  }

  getExecutable (): ExecutableOperation {
    return this.executable
  }

  getAssets (): Set<string> {
    const assets = new Set<string>()
    // refresh balances of all sent assets to sync it
    for (const asset of this.spendings) {
      const assetId: string = asset.assetId
      if (!assets.has(assetId)) {
        assets.add(assetId)
      }
    }
    // refresh balances of all created values in case it was sent to self
    for (const [assetId] of this.values) {
      if (!assets.has(assetId)) {
        assets.add(assetId)
      }
    }
    return assets
  }

  abstract getChains (): Blockchain[]

  getErrors (): Error[] {
    return this.errors
  }
}

export class ChainOperationSummary extends AbstractOperationSummary {
  override operation: ChainNetworkOperation
  chain: Blockchain
  fee: FeeData

  constructor (
    provider: MCNProvider,
    operation: ChainNetworkOperation,
    chain: Blockchain,
    fee: FeeData,
    spendings: Spending[],
    values: Map<string, bigint>,
    errors: Error[]
  ) {
    super(provider, operation, [fee], spendings, values, errors)
    this.operation = operation
    this.chain = chain
    this.fee = fee
  }

  getChains (): Blockchain[] {
    return [this.chain]
  }
}

export class CrossOperationSummary extends AbstractOperationSummary {
  override operation: CrossOperation
  chains: Blockchain[]

  constructor (
    provider: MCNProvider,
    operation: CrossOperation,
    chains: Blockchain[],
    fees: FeeData[],
    spendings: Spending[],
    values: Map<string, bigint>,
    errors: Error[]
  ) {
    super(provider, operation, fees, spendings, values, errors)
    this.operation = operation
    this.chains = chains
  }

  getChains (): Blockchain[] {
    return this.chains
  }
}

export class StakingOperationSummary extends ChainOperationSummary {
  potentialReward: bigint

  constructor (
    provider: MCNProvider,
    operation: Staking,
    chain: PlatformBlockchain,
    fee: UtxoFeeData,
    spendings: Spending[],
    values: Map<string, bigint>,
    potentialReward: bigint,
    errors: Error[]
  ) {
    super(provider, operation, chain, fee, spendings, values, errors)
    this.potentialReward = potentialReward
  }
}

export class CrossResumeOperationSummary extends ChainOperationSummary {
  override operation: CrossResumeOperation
  importFee: FeeData
  payImportFee: boolean
  utxoSet: Utxo[]

  constructor (
    provider: MCNProvider,
    operation: CrossResumeOperation,
    importFee: FeeData,
    spendings: Spending[],
    values: Map<string, bigint>,
    payImportFee: boolean,
    utxoSet: Utxo[],
    errors: Error[]
  ) {
    super(provider, operation, operation.destination, importFee, spendings, values, errors)
    this.operation = operation
    this.importFee = importFee
    this.payImportFee = payImportFee
    this.utxoSet = utxoSet
  }
}

export class DepositResumeOperationSummary extends ChainOperationSummary {
  override operation: DepositResumeOperation
  fee: EVMFeeData

  constructor (
    provider: MCNProvider,
    operation: DepositResumeOperation,
    fee: EVMFeeData,
    spendings: Spending[],
    values: Map<string, bigint>,
    errors: Error[]
  ) {
    super(provider, operation, operation.chain, fee, spendings, values, errors)
    this.operation = operation
    this.fee = fee
  }
}
