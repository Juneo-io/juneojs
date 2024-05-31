import { type JRC20Asset, type WrappedAsset } from '../../asset'
import { type Blockchain, type JEVMBlockchain, type PlatformBlockchain } from '../../chain'
import { BLSPublicKey, BLSSignature, DynamicId, type Utxo } from '../../transaction'

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
  CreateSupernet = 'Create supernet',
  ValidateSupernet = 'Validate supernet',
  RemoveSupernetValidator = 'Remove supernet validator',
  CreateChain = 'Create chain',
  EthCall = 'Eth call',
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

abstract class JEVMChainOperation extends ChainNetworkOperation {
  override chain: JEVMBlockchain

  constructor (type: NetworkOperationType, chain: JEVMBlockchain) {
    super(type, chain)
    this.chain = chain
  }
}

abstract class Wrapping extends JEVMChainOperation {
  asset: WrappedAsset
  amount: bigint

  constructor (type: NetworkOperationType, chain: JEVMBlockchain, asset: WrappedAsset, amount: bigint) {
    super(type, chain)
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

export class RedeemAuctionOperation extends JEVMChainOperation {
  auctionAddress: string
  auctionId: bigint

  constructor (chain: JEVMBlockchain, auctionAddress: string, auctionId: bigint) {
    super(NetworkOperationType.RedeemAuction, chain)
    this.auctionAddress = auctionAddress
    this.auctionId = auctionId
  }
}

abstract class StreamOperation extends JEVMChainOperation {
  streamAddress: string
  streamId: bigint

  constructor (type: NetworkOperationType, chain: JEVMBlockchain, streamAddress: string, streamId: bigint) {
    super(type, chain)
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

export class EthCallOperation extends JEVMChainOperation {
  contract: string
  abi: string
  functionName: string
  values: any[]
  amount: bigint

  constructor (
    chain: JEVMBlockchain,
    contract: string,
    abi: string,
    functionName: string,
    values: any[],
    amount: bigint
  ) {
    super(NetworkOperationType.EthCall, chain)
    this.contract = contract
    this.abi = abi
    this.functionName = functionName
    this.values = values
    this.amount = amount
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
    chain: PlatformBlockchain,
    nodeId: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint,
    stakeAddresses: string[],
    stakeThreshold: number,
    rewardAddresses: string[],
    rewardThreshold: number
  ) {
    super(type, chain)
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
    chain: PlatformBlockchain,
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
      chain,
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
    chain: PlatformBlockchain,
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
      chain,
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

export class CreateSupernetOperation extends ChainNetworkOperation {
  supernetAuthAddresses: string[]
  supernetAuthThreshold: number

  constructor (chain: PlatformBlockchain, supernetAuthAddresses: string[], supernetAuthThreshold: number) {
    super(NetworkOperationType.CreateSupernet, chain)
    this.supernetAuthAddresses = supernetAuthAddresses
    this.supernetAuthThreshold = supernetAuthThreshold
  }
}

export class AddSupernetValidatorOperation extends ChainNetworkOperation {
  supernetId: string
  nodeId: string
  amount: bigint
  startTime: bigint
  endTime: bigint

  constructor (
    chain: PlatformBlockchain,
    supernetId: string,
    nodeId: string,
    amount: bigint,
    startTime: bigint,
    endTime: bigint
  ) {
    super(NetworkOperationType.ValidateSupernet, chain)
    this.supernetId = supernetId
    this.nodeId = nodeId
    this.amount = amount
    this.startTime = startTime
    this.endTime = endTime
  }
}

export class RemoveSupernetValidatorOperation extends ChainNetworkOperation {
  supernetId: string
  nodeId: string

  constructor (chain: PlatformBlockchain, supernetId: string, nodeId: string) {
    super(NetworkOperationType.RemoveSupernetValidator, chain)
    this.supernetId = supernetId
    this.nodeId = nodeId
  }
}

export class CreateChainOperation extends ChainNetworkOperation {
  supernetId: string
  chainName: string
  vmId: DynamicId
  genesisData: string
  chainAssetId: string
  fxIds: DynamicId[]

  constructor (
    chain: PlatformBlockchain,
    supernetId: string,
    chainName: string,
    vmId: string,
    genesisData: string,
    chainAssetId: string = chain.assetId,
    fxIds = []
  ) {
    super(NetworkOperationType.CreateChain, chain)
    this.supernetId = supernetId
    this.chainName = chainName
    this.vmId = new DynamicId(vmId)
    this.genesisData = genesisData
    this.chainAssetId = chainAssetId
    this.fxIds = fxIds
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

export class DepositResumeOperation extends JEVMChainOperation {
  asset: JRC20Asset
  amount: bigint

  constructor (chain: JEVMBlockchain, asset: JRC20Asset, amount: bigint) {
    super(NetworkOperationType.DepositResume, chain)
    this.asset = asset
    this.amount = amount
  }
}
