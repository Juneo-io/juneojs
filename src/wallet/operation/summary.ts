import { type PlatformBlockchain, type Blockchain } from '../../chain'
import { type Utxo } from '../../transaction'
import { type UtxoFeeData, type FeeData, type Spending } from '../transaction'
import { ExecutableOperation } from './executable'
import { type Staking, type NetworkOperation, type CrossResumeOperation, type ChainNetworkOperation } from './operation'

export interface OperationSummary {
  operation: NetworkOperation
  fees: FeeData[]
  spendings: Spending[]
  values: Map<string, bigint>

  getExecutable: () => ExecutableOperation

  getChains: () => Blockchain[]
}

abstract class AbstractOperationSummary implements OperationSummary {
  operation: NetworkOperation
  fees: FeeData[]
  spendings: Spending[]
  values: Map<string, bigint>
  private readonly executable: ExecutableOperation

  constructor (operation: NetworkOperation, fees: FeeData[], spendings: Spending[], values: Map<string, bigint>) {
    this.operation = operation
    this.fees = fees
    this.spendings = spendings
    this.values = values
    this.executable = new ExecutableOperation()
  }

  getExecutable (): ExecutableOperation {
    return this.executable
  }

  abstract getChains (): Blockchain[]
}

export class ChainOperationSummary extends AbstractOperationSummary {
  override operation: ChainNetworkOperation
  chain: Blockchain
  fee: FeeData

  constructor (
    operation: ChainNetworkOperation,
    chain: Blockchain,
    fee: FeeData,
    spendings: Spending[],
    values: Map<string, bigint>
  ) {
    super(operation, [fee], spendings, values)
    this.operation = operation
    this.chain = chain
    this.fee = fee
  }

  getChains (): Blockchain[] {
    return [this.chain]
  }
}

export class MCNOperationSummary extends AbstractOperationSummary {
  chains: Blockchain[]

  constructor (
    operation: NetworkOperation,
    chains: Blockchain[],
    fees: FeeData[],
    spendings: Spending[],
    values: Map<string, bigint>
  ) {
    super(operation, fees, spendings, values)
    this.chains = chains
  }

  getChains (): Blockchain[] {
    return this.chains
  }
}

export class StakingOperationSummary extends ChainOperationSummary {
  potentialReward: bigint

  constructor (
    operation: Staking,
    chain: PlatformBlockchain,
    fee: UtxoFeeData,
    spendings: Spending[],
    values: Map<string, bigint>,
    potentialReward: bigint
  ) {
    super(operation, chain, fee, spendings, values)
    this.potentialReward = potentialReward
  }
}

export class CrossResumeOperationSummary extends ChainOperationSummary {
  override operation: CrossResumeOperation
  importFee: FeeData
  payImportFee: boolean
  utxoSet: Utxo[]

  constructor (
    operation: CrossResumeOperation,
    importFee: FeeData,
    spendings: Spending[],
    values: Map<string, bigint>,
    payImportFee: boolean,
    utxoSet: Utxo[]
  ) {
    super(operation, operation.destination, importFee, spendings, values)
    this.operation = operation
    this.importFee = importFee
    this.payImportFee = payImportFee
    this.utxoSet = utxoSet
  }
}
