import { type PlatformBlockchain, type Blockchain } from '../../chain'
import { type Staking } from '../stake'
import { type UtxoFeeData, type FeeData, type Spending } from '../transaction'
import { ExecutableMCNOperation } from './executable'
import { type NetworkOperation } from './operation'

export interface OperationSummary {
  operation: NetworkOperation
  spendings: Spending[]
}

abstract class AbstractOperationSummary implements OperationSummary {
  operation: NetworkOperation
  spendings: Spending[]
  private readonly executable: ExecutableMCNOperation

  constructor (operation: NetworkOperation, spendings: Spending[]) {
    this.operation = operation
    this.spendings = spendings
    this.executable = ExecutableMCNOperation.from(this)
  }

  getExecutable (): ExecutableMCNOperation {
    return this.executable
  }
}

export class ChainOperationSummary extends AbstractOperationSummary {
  chain: Blockchain
  fee: FeeData

  constructor (operation: NetworkOperation, chain: Blockchain, fee: FeeData, spendings: Spending[]) {
    super(operation, spendings)
    this.chain = chain
    this.fee = fee
  }
}

export class MCNOperationSummary extends AbstractOperationSummary {
  chains: Blockchain[]
  fees: FeeData[]

  constructor (operation: NetworkOperation, chains: Blockchain[], fees: FeeData[], spendings: Spending[]) {
    super(operation, spendings)
    this.chains = chains
    this.fees = fees
  }
}

export class StakingOperationSummary extends ChainOperationSummary {
  potentialReward: bigint

  constructor (operation: Staking, chain: PlatformBlockchain, fee: UtxoFeeData, spendings: Spending[], potentialReward: bigint) {
    super(operation, chain, fee, spendings)
    this.potentialReward = potentialReward
  }
}
