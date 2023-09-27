import { type PlatformBlockchain, type Blockchain } from '../../chain'
import { type Utxo } from '../../transaction'
import { type UtxoFeeData, type FeeData, type Spending } from '../transaction'
import { ExecutableOperation } from './executable'
import { type Staking, type NetworkOperation, type CrossResumeOperation } from './operation'

export enum SummaryType {
  Chain = 'Chain',
  MCN = 'MCN'
}

export interface OperationSummary {
  type: SummaryType
  operation: NetworkOperation
  fees: FeeData[]
  spendings: Spending[]

  getExecutable: () => ExecutableOperation
}

abstract class AbstractOperationSummary implements OperationSummary {
  type: SummaryType
  operation: NetworkOperation
  spendings: Spending[]
  fees: FeeData[]
  private readonly executable: ExecutableOperation

  constructor (type: SummaryType, operation: NetworkOperation, fees: FeeData[], spendings: Spending[]) {
    this.type = type
    this.operation = operation
    this.fees = fees
    this.spendings = spendings
    this.executable = new ExecutableOperation()
  }

  getExecutable (): ExecutableOperation {
    return this.executable
  }
}

export class ChainOperationSummary extends AbstractOperationSummary {
  chain: Blockchain
  fee: FeeData

  constructor (operation: NetworkOperation, chain: Blockchain, fee: FeeData, spendings: Spending[]) {
    super(SummaryType.Chain, operation, [fee], spendings)
    this.chain = chain
    this.fee = fee
  }
}

export class MCNOperationSummary extends AbstractOperationSummary {
  chains: Blockchain[]

  constructor (operation: NetworkOperation, chains: Blockchain[], fees: FeeData[], spendings: Spending[]) {
    super(SummaryType.MCN, operation, fees, spendings)
    this.chains = chains
  }
}

export class StakingOperationSummary extends ChainOperationSummary {
  potentialReward: bigint

  constructor (operation: Staking, chain: PlatformBlockchain, fee: UtxoFeeData, spendings: Spending[], potentialReward: bigint) {
    super(operation, chain, fee, spendings)
    this.potentialReward = potentialReward
  }
}

export class CrossResumeOperationSummary extends MCNOperationSummary {
  override operation: CrossResumeOperation
  importFee: FeeData
  payImportFee: boolean
  utxoSet: Utxo[]
  values: Map<string, bigint>

  constructor (
    operation: CrossResumeOperation, importFee: FeeData, spendings: Spending[], payImportFee: boolean, utxoSet: Utxo[], values: Map<string, bigint>
  ) {
    super(operation, [operation.source, operation.destination], [importFee], spendings)
    this.operation = operation
    this.importFee = importFee
    this.payImportFee = payImportFee
    this.utxoSet = utxoSet
    this.values = values
  }
}
