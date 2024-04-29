import { type JRC20Asset, type WrappedAsset } from '../../asset'
import { type JEVMBlockchain, type Blockchain } from '../../chain'
import { type MCN } from '../../network'
import { BLSPublicKey, BLSSignature, type Utxo } from '../../transaction'

export enum NetworkOperationType {
  Send = 'Send',
  SendUtxo = 'Send utxo',
  Cross = 'Cross',
  CrossResume = 'Cross resume',
  DepositResume = 'Deposit resume',
  Bridge = 'Bridge',
  ValidatePrimary = 'Validate primary',
  DelegatePrimary = 'Delegate primary',
  Wrap = 'Wrap',
  Unwrap = 'Unwrap',
  RedeemAuction = 'Redeem auction',
  WithdrawStream = 'Withdraw stream',
  CancelStream = 'Cancel stream',
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

  constructor (
    chain: Blockchain,
    assetId: string,
    amount: bigint,
    addresses: string[],
    threshold: number,
    locktime: bigint = BigInt(0)
  ) {
    super(NetworkOperationType.SendUtxo, chain)
    this.assetId = assetId
    this.amount = amount
    this.addresses = addresses
    this.threshold = threshold
    this.locktime = locktime
  }
}

abstract class Wrapping extends ChainNetworkOperation {
  override chain: JEVMBlockchain
  asset: WrappedAsset
  amount: bigint

  constructor (type: NetworkOperationType, chain: JEVMBlockchain, asset: WrappedAsset, amount: bigint) {
    super(type, chain)
    this.chain = chain
    this.asset = asset
    this.amount = amount
  }
}

export class WrapOperation extends Wrapping {
  constructor (chain: JEVMBlockchain, asset: WrappedAsset, amount: bigint) {
    super(NetworkOperationType.Wrap, chain, asset, amount)
  }
}

export class UnwrapOperation extends Wrapping {
  constructor (chain: JEVMBlockchain, asset: WrappedAsset, amount: bigint) {
    super(NetworkOperationType.Unwrap, chain, asset, amount)
  }
}

export class RedeemAuctionOperation extends ChainNetworkOperation {
  override chain: JEVMBlockchain
  auctionAddress: string
  auctionId: bigint

  constructor (chain: JEVMBlockchain, auctionAddress: string, auctionId: bigint) {
    super(NetworkOperationType.RedeemAuction, chain)
    this.chain = chain
    this.auctionAddress = auctionAddress
    this.auctionId = auctionId
  }
}

abstract class StreamOperation extends ChainNetworkOperation {
  override chain: JEVMBlockchain
  streamAddress: string
  streamId: bigint

  constructor (type: NetworkOperationType, chain: JEVMBlockchain, streamAddress: string, streamId: bigint) {
    super(type, chain)
    this.chain = chain
    this.streamAddress = streamAddress
    this.streamId = streamId
  }
}

export class WithdrawStreamOperation extends StreamOperation {
  amount: bigint

  constructor (chain: JEVMBlockchain, streamAddress: string, streamId: bigint, amount: bigint) {
    super(NetworkOperationType.WithdrawStream, chain, streamAddress, streamId)
    this.amount = amount
  }
}

export class CancelStreamOperation extends StreamOperation {
  constructor (chain: JEVMBlockchain, streamAddress: string, streamId: bigint) {
    super(NetworkOperationType.CancelStream, chain, streamAddress, streamId)
  }
}

export abstract class Staking extends ChainNetworkOperation {
  nodeId: string
  amount: bigint
  startTime: bigint
  endTime: bigint
  stakeAddresses: string[]
  stakeThreshold: number
  rewardAddresses: string[]
  rewardThreshold: number

  constructor (
    type: NetworkOperationType,
    mcn: MCN,
    nodeId: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint,
    stakeAddresses: string[],
    stakeThreshold: number,
    rewardAddresses: string[],
    rewardThreshold: number
  ) {
    super(type, mcn.primary.platform)
    this.nodeId = nodeId
    this.amount = amount
    this.startTime = startTime
    this.endTime = endTime
    this.stakeAddresses = stakeAddresses
    this.stakeThreshold = stakeThreshold
    this.rewardAddresses = rewardAddresses
    this.rewardThreshold = rewardThreshold
  }
}

export class ValidatePrimaryOperation extends Staking {
  publicKey: BLSPublicKey
  signature: BLSSignature

  constructor (
    mcn: MCN,
    nodeId: string,
    publicKey: string,
    signature: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint,
    stakeAddresses: string[],
    stakeThreshold: number,
    rewardAddresses: string[],
    rewardThreshold: number
  ) {
    super(
      NetworkOperationType.ValidatePrimary,
      mcn,
      nodeId,
      amount,
      startTime,
      endTime,
      stakeAddresses,
      stakeThreshold,
      rewardAddresses,
      rewardThreshold
    )
    this.publicKey = new BLSPublicKey(publicKey)
    this.signature = new BLSSignature(signature)
  }
}

export class DelegatePrimaryOperation extends Staking {
  constructor (
    mcn: MCN,
    nodeId: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint,
    stakeAddresses: string[],
    stakeThreshold: number,
    rewardAddresses: string[],
    rewardThreshold: number
  ) {
    super(
      NetworkOperationType.DelegatePrimary,
      mcn,
      nodeId,
      amount,
      startTime,
      endTime,
      stakeAddresses,
      stakeThreshold,
      rewardAddresses,
      rewardThreshold
    )
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
