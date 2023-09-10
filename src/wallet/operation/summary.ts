import { type PlatformBlockchain, type Blockchain } from '../../chain'
import { type Staking } from '../stake'
import { type UtxoFeeData, type FeeData, type Spending } from '../transaction'
import { ExecutableMCNOperation } from './executable'
import { type NetworkOperation } from './operation'

export enum SummaryType {
  Chain = 'Chain',
  MCN = 'MCN'
}

export interface OperationSummary {
  type: SummaryType
  operation: NetworkOperation
  fees: FeeData[]
  spendings: Spending[]
}

abstract class AbstractOperationSummary implements OperationSummary {
  type: SummaryType
  operation: NetworkOperation
  spendings: Spending[]
  fees: FeeData[]
  private readonly executable: ExecutableMCNOperation

  constructor (type: SummaryType, operation: NetworkOperation, fees: FeeData[], spendings: Spending[]) {
    this.type = type
    this.operation = operation
    this.fees = fees
    this.spendings = spendings
    this.executable = new ExecutableMCNOperation()
  }

  getExecutable (): ExecutableMCNOperation {
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
