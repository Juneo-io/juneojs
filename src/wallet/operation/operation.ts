import { type JRC20Asset, type WrappedAsset } from '../../asset'
import { type JEVMBlockchain, type Blockchain } from '../../chain'
import { type MCN } from '../../network'
import { type Utxo } from '../../transaction'

export enum NetworkOperationType {
  Send = 'Send',
  SendUtxo = 'Send utxo',
  Cross = 'Cross',
  CrossResume = 'Cross resume',
  DepositResume = 'Deposit resume',
  Bridge = 'Bridge',
  Validate = 'Validate',
  Delegate = 'Delegate',
  Wrap = 'Wrap',
  Unwrap = 'Unwrap',
}

export enum NetworkOperationRange {
  Chain = 'Chain',
  Supernet = 'Supernet',
  MCN = 'MCN',
}

export interface NetworkOperation {
  type: NetworkOperationType
  range: NetworkOperationRange
}

export abstract class ChainNetworkOperation implements NetworkOperation {
  type: NetworkOperationType
  range: NetworkOperationRange = NetworkOperationRange.Chain
  chain: Blockchain

  constructor (type: NetworkOperationType, chain: Blockchain) {
    this.type = type
    this.chain = chain
  }
}

export enum NetworkOperationStatus {
  Initializing = 'Initializing',
  Executing = 'Executing',
  Done = 'Done',
  Timeout = 'Timeout',
  Error = 'Error',
}

export class SendOperation extends ChainNetworkOperation {
  assetId: string
  amount: bigint
  address: string

  constructor (chain: Blockchain, assetId: string, amount: bigint, address: string) {
    super(NetworkOperationType.Send, chain)
    this.assetId = assetId
    this.amount = amount
    this.address = address
  }
}

export class SendUtxoOperation extends ChainNetworkOperation {
  assetId: string
  amount: bigint
  addresses: string[]
  threshold: number
  locktime: bigint

  constructor (chain: Blockchain, assetId: string, amount: bigint, addresses: string[], threshold: number, locktime: bigint = BigInt(0)) {
    super(NetworkOperationType.SendUtxo, chain)
    this.assetId = assetId
    this.amount = amount
    this.addresses = addresses
    this.threshold = threshold
    this.locktime = locktime
  }
}

abstract class Wrapping extends ChainNetworkOperation {
  asset: WrappedAsset
  amount: bigint

  constructor (type: NetworkOperationType, chain: Blockchain, asset: WrappedAsset, amount: bigint) {
    super(type, chain)
    this.asset = asset
    this.amount = amount
  }
}

export class WrapOperation extends Wrapping {
  constructor (chain: Blockchain, asset: WrappedAsset, amount: bigint) {
    super(NetworkOperationType.Wrap, chain, asset, amount)
  }
}

export class UnwrapOperation extends Wrapping {
  constructor (chain: Blockchain, asset: WrappedAsset, amount: bigint) {
    super(NetworkOperationType.Unwrap, chain, asset, amount)
  }
}

export abstract class Staking extends ChainNetworkOperation {
  nodeId: string
  amount: bigint
  startTime: bigint
  endTime: bigint

  constructor (
    type: NetworkOperationType,
    mcn: MCN,
    nodeId: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint
  ) {
    super(type, mcn.primary.platform)
    this.nodeId = nodeId
    this.amount = amount
    this.startTime = startTime
    this.endTime = endTime
  }
}

export class ValidateOperation extends Staking {
  constructor (mcn: MCN, nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(NetworkOperationType.Validate, mcn, nodeId, amount, startTime, endTime)
  }
}

export class DelegateOperation extends Staking {
  constructor (mcn: MCN, nodeId: string, amount: bigint, startTime: bigint, endTime: bigint) {
    super(NetworkOperationType.Delegate, mcn, nodeId, amount, startTime, endTime)
  }
}

export class CrossOperation implements NetworkOperation {
  type: NetworkOperationType = NetworkOperationType.Cross
  range: NetworkOperationRange = NetworkOperationRange.Supernet
  source: Blockchain
  destination: Blockchain
  assetId: string
  amount: bigint
  sendImportFee: boolean = true

  constructor (source: Blockchain, destination: Blockchain, assetId: string, amount: bigint) {
    this.source = source
    this.destination = destination
    this.assetId = assetId
    this.amount = amount
  }
}

export class CrossResumeOperation extends ChainNetworkOperation {
  source: Blockchain
  destination: Blockchain
  utxoSet: Utxo[]

  constructor (source: Blockchain, destination: Blockchain, utxoSet: Utxo[]) {
    super(NetworkOperationType.CrossResume, destination)
    this.source = source
    this.destination = destination
    this.utxoSet = utxoSet
  }
}

export class DepositResumeOperation extends ChainNetworkOperation {
  override chain: JEVMBlockchain
  asset: JRC20Asset
  amount: bigint

  constructor (chain: JEVMBlockchain, asset: JRC20Asset, amount: bigint) {
    super(NetworkOperationType.DepositResume, chain)
    this.chain = chain
    this.asset = asset
    this.amount = amount
  }
}
