import { type PlatformBlockchain, type Blockchain } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { type Utxo } from '../../transaction'
import { type UtxoFeeData, type FeeData, type Spending, type EVMFeeData } from '../transaction'
import { ExecutableOperation } from './executable'
import {
  type Staking,
  type NetworkOperation,
  type CrossResumeOperation,
  type ChainNetworkOperation,
  type CrossOperation,
  type DepositResumeOperation
} from './operation'

export interface OperationSummary {
  operation: NetworkOperation
  fees: FeeData[]
  spendings: Spending[]
  values: Map<string, bigint>

  getExecutable: () => ExecutableOperation

  getAssets: () => Set<string>

  getChains: () => Blockchain[]
}

abstract class AbstractOperationSummary implements OperationSummary {
  operation: NetworkOperation
  fees: FeeData[]
  spendings: Spending[]
  values: Map<string, bigint>
  private readonly executable: ExecutableOperation

  constructor (
    provider: MCNProvider,
    operation: NetworkOperation,
    fees: FeeData[],
    spendings: Spending[],
    values: Map<string, bigint>
  ) {
    this.operation = operation
    this.fees = fees
    this.spendings = spendings
    this.values = values
    this.executable = new ExecutableOperation(provider)
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
    values: Map<string, bigint>
  ) {
    super(provider, operation, [fee], spendings, values)
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
    values: Map<string, bigint>
  ) {
    super(provider, operation, fees, spendings, values)
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
    potentialReward: bigint
  ) {
    super(provider, operation, chain, fee, spendings, values)
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
    utxoSet: Utxo[]
  ) {
    super(provider, operation, operation.destination, importFee, spendings, values)
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
    values: Map<string, bigint>
  ) {
    super(provider, operation, operation.chain, fee, spendings, values)
    this.operation = operation
    this.fee = fee
  }
}
