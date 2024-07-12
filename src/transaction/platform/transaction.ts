import { JuneoBuffer } from '../../utils'
import {
  AddPermissionlessDelegatorTransactionTypeId,
  AddPermissionlessValidatorTransactionTypeId,
  AddSupernetValidatorTransactionType as AddSupernetValidatorTransactionTypeId,
  AssetIdSize,
  CreateChainTransactionTypeId,
  CreateSupernetTransactionTypeId,
  DynamicIdSize,
  NodeIdSize,
  PlatformBaseTransactionTypeId,
  PlatformExportTransactionTypeId,
  PlatformImportTransactionTypeId,
  PrimarySignerSize,
  RemoveSupernetValidatorTransactionTypeId,
  SupernetIdSize,
  TransferSupernetOwnershipTransactionTypeId,
  TransformSupernetTransactionTypeId,
  ValidatorSize
} from '../constants'
import { type TransferableInput } from '../input'
import { Secp256k1OutputOwners, TransferableOutput } from '../output'
import { type Signable } from '../signature'
import { BaseTransaction, ExportTransaction, ImportTransaction } from '../transaction'
import { type Address, AssetId, type BlockchainId, DynamicId, NodeId, SupernetId } from '../types'
import { type BLSSigner, PrimarySigner, SupernetAuth, Validator } from './supernet'

export class PlatformBaseTransaction extends BaseTransaction {
  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string
  ) {
    super(PlatformBaseTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
  }

  static parse (data: string | JuneoBuffer): PlatformBaseTransaction {
    return BaseTransaction.parse(data, PlatformBaseTransactionTypeId)
  }
}

export class PlatformExportTransaction extends ExportTransaction {
  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    destinationChain: BlockchainId,
    exportedOutputs: TransferableOutput[]
  ) {
    super(
      PlatformExportTransactionTypeId,
      networkId,
      blockchainId,
      outputs,
      inputs,
      memo,
      destinationChain,
      exportedOutputs
    )
  }

  static parse (data: string | JuneoBuffer): PlatformExportTransaction {
    return ExportTransaction.parse(data, PlatformExportTransactionTypeId)
  }
}

export class PlatformImportTransaction extends ImportTransaction {
  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    sourceChain: BlockchainId,
    importedInputs: TransferableInput[]
  ) {
    super(PlatformImportTransactionTypeId, networkId, blockchainId, outputs, inputs, memo, sourceChain, importedInputs)
  }

  static parse (data: string | JuneoBuffer): PlatformImportTransaction {
    return ImportTransaction.parse(data, PlatformImportTransactionTypeId)
  }
}

export class AddSupernetValidatorTransaction extends BaseTransaction {
  validator: Validator
  supernetId: SupernetId
  supernetAuth: SupernetAuth

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    validator: Validator,
    supernetId: SupernetId,
    supernetAuth: SupernetAuth
  ) {
    super(AddSupernetValidatorTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.validator = validator
    this.supernetId = supernetId
    this.supernetAuth = supernetAuth
  }

  getSignables (): Signable[] {
    return [...this.inputs, this.supernetAuth]
  }

  serialize (): JuneoBuffer {
    const baseTransaction = super.serialize()
    const supernetAuthBytes = this.supernetAuth.serialize()
    const buffer = JuneoBuffer.alloc(baseTransaction.length + ValidatorSize + SupernetIdSize + supernetAuthBytes.length)
    buffer.write(baseTransaction)
    buffer.write(this.validator)
    buffer.write(this.supernetId)
    buffer.write(supernetAuthBytes)
    return buffer
  }

  static parse (data: string | JuneoBuffer): AddSupernetValidatorTransaction {
    const baseTx = BaseTransaction.parse(data, AddSupernetValidatorTransactionTypeId)
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    reader.skip(baseTx)
    const validator = Validator.parse(reader.read(ValidatorSize))
    const supernetId = new SupernetId(reader.read(SupernetIdSize).toCB58())
    const supernetAuth = SupernetAuth.parse(reader.readRemaining())
    return new AddSupernetValidatorTransaction(
      baseTx.networkId,
      baseTx.blockchainId,
      baseTx.outputs,
      baseTx.inputs,
      baseTx.memo,
      validator,
      supernetId,
      supernetAuth
    )
  }
}

export class CreateSupernetTransaction extends BaseTransaction {
  rewardsOwner: Secp256k1OutputOwners

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    rewardsOwner: Secp256k1OutputOwners
  ) {
    super(CreateSupernetTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.rewardsOwner = rewardsOwner
  }

  getSupernetAuth (addresses: Address[]): SupernetAuth {
    return new SupernetAuth(addresses, this.rewardsOwner)
  }

  serialize (): JuneoBuffer {
    const baseTransaction = super.serialize()
    const rewardsOwnerBytes = this.rewardsOwner.serialize()
    const buffer = JuneoBuffer.alloc(baseTransaction.length + rewardsOwnerBytes.length)
    buffer.write(baseTransaction)
    buffer.write(rewardsOwnerBytes)
    return buffer
  }

  static parse (data: string | JuneoBuffer): CreateSupernetTransaction {
    const baseTx = BaseTransaction.parse(data, CreateSupernetTransactionTypeId)
    const reader = JuneoBuffer.from(data).createReader()
    reader.skip(baseTx)
    const rewardsOwner = Secp256k1OutputOwners.parse(reader.readRemaining())
    return new CreateSupernetTransaction(
      baseTx.networkId,
      baseTx.blockchainId,
      baseTx.outputs,
      baseTx.inputs,
      baseTx.memo,
      rewardsOwner
    )
  }
}

export class CreateChainTransaction extends BaseTransaction {
  supernetId: SupernetId
  name: string
  chainAssetId: AssetId
  vmId: DynamicId
  fxIds: DynamicId[]
  genesisData: string
  supernetAuth: SupernetAuth

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    supernetId: SupernetId,
    name: string,
    chainAssetId: AssetId,
    vmId: DynamicId,
    fxIds: DynamicId[],
    genesisData: string,
    supernetAuth: SupernetAuth
  ) {
    super(CreateChainTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.supernetId = supernetId
    this.name = name
    this.chainAssetId = chainAssetId
    this.vmId = vmId
    this.fxIds = fxIds
    this.genesisData = genesisData
    this.supernetAuth = supernetAuth
  }

  getSignables (): Signable[] {
    return [...this.inputs, this.supernetAuth]
  }

  serialize (): JuneoBuffer {
    const baseTransaction = super.serialize()
    const supernetAuthBytes = this.supernetAuth.serialize()
    const buffer = JuneoBuffer.alloc(
      baseTransaction.length +
        SupernetIdSize +
        2 +
        this.name.length +
        AssetIdSize +
        DynamicIdSize +
        4 +
        DynamicIdSize * this.fxIds.length +
        4 +
        this.genesisData.length +
        supernetAuthBytes.length
    )
    buffer.write(baseTransaction)
    buffer.write(this.supernetId)
    buffer.writeUInt16(this.name.length)
    buffer.writeString(this.name)
    buffer.write(this.chainAssetId)
    buffer.write(this.vmId)
    buffer.writeUInt32(this.fxIds.length)
    for (const fxId of this.fxIds) {
      buffer.write(fxId)
    }
    buffer.writeUInt32(this.genesisData.length)
    buffer.writeString(this.genesisData)
    buffer.write(supernetAuthBytes)
    return buffer
  }

  static parse (data: string | JuneoBuffer): CreateChainTransaction {
    const baseTx = BaseTransaction.parse(data, CreateChainTransactionTypeId)
    const reader = JuneoBuffer.from(data).createReader()
    reader.skip(baseTx)
    const supernetId = new SupernetId(reader.read(SupernetIdSize).toCB58())
    const nameLength = reader.readUInt16()
    const name = reader.readString(nameLength)
    const chainAssetId = new AssetId(reader.read(AssetIdSize).toCB58())
    const vmId = new DynamicId(reader.readString(DynamicIdSize))
    const fxIdsLength = reader.readUInt32()
    const fxIds: DynamicId[] = []
    for (let i = 0; i < fxIdsLength; i++) {
      fxIds.push(new DynamicId(reader.readString(DynamicIdSize)))
    }
    const genesisDataLength = reader.readUInt32()
    const genesisData = reader.readString(genesisDataLength)
    const supernetAuth = SupernetAuth.parse(reader.readRemaining())
    return new CreateChainTransaction(
      baseTx.networkId,
      baseTx.blockchainId,
      baseTx.outputs,
      baseTx.inputs,
      baseTx.memo,
      supernetId,
      name,
      chainAssetId,
      vmId,
      fxIds,
      genesisData,
      supernetAuth
    )
  }
}

export class TransferSupernetOwnershipTransaction extends BaseTransaction {
  supernetId: SupernetId
  supernetAuth: SupernetAuth
  owner: Secp256k1OutputOwners

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    supernetId: SupernetId,
    supernetAuth: SupernetAuth,
    owner: Secp256k1OutputOwners
  ) {
    super(TransferSupernetOwnershipTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.supernetId = supernetId
    this.supernetAuth = supernetAuth
    this.owner = owner
  }

  getSignables (): Signable[] {
    return [...this.inputs, this.supernetAuth]
  }

  serialize (): JuneoBuffer {
    const baseTransaction = super.serialize()
    const supernetAuthBytes = this.supernetAuth.serialize()
    const ownerBytes = this.owner.serialize()
    const buffer = JuneoBuffer.alloc(
      baseTransaction.length + SupernetIdSize + supernetAuthBytes.length + ownerBytes.length
    )
    buffer.write(baseTransaction)
    buffer.write(this.supernetId)
    buffer.write(supernetAuthBytes)
    buffer.write(ownerBytes)
    return buffer
  }

  static parse (data: string | JuneoBuffer): TransferSupernetOwnershipTransaction {
    const baseTx = BaseTransaction.parse(data, TransferSupernetOwnershipTransactionTypeId)
    const reader = JuneoBuffer.from(data).createReader()
    reader.skip(baseTx)
    const supernetId = new SupernetId(reader.read(SupernetIdSize).toCB58())
    const supernetAuth = SupernetAuth.parse(reader.peekRemaining())
    reader.skip(supernetAuth)
    const owner = Secp256k1OutputOwners.parse(reader.readRemaining())
    return new TransferSupernetOwnershipTransaction(
      baseTx.networkId,
      baseTx.blockchainId,
      baseTx.outputs,
      baseTx.inputs,
      baseTx.memo,
      supernetId,
      supernetAuth,
      owner
    )
  }
}

export class RemoveSupernetValidatorTransaction extends BaseTransaction {
  nodeId: NodeId
  supernetId: SupernetId
  supernetAuth: SupernetAuth

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    nodeId: NodeId,
    supernetId: SupernetId,
    supernetAuth: SupernetAuth
  ) {
    super(RemoveSupernetValidatorTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.nodeId = nodeId
    this.supernetId = supernetId
    this.supernetAuth = supernetAuth
  }

  getSignables (): Signable[] {
    return [...this.inputs, this.supernetAuth]
  }

  serialize (): JuneoBuffer {
    const baseTransaction = super.serialize()
    const supernetAuthBytes = this.supernetAuth.serialize()
    const buffer = JuneoBuffer.alloc(baseTransaction.length + NodeIdSize + SupernetIdSize + supernetAuthBytes.length)
    buffer.write(baseTransaction)
    buffer.write(this.nodeId)
    buffer.write(this.supernetId)
    buffer.write(supernetAuthBytes)
    return buffer
  }

  static parse (data: string | JuneoBuffer): RemoveSupernetValidatorTransaction {
    const baseTx = BaseTransaction.parse(data, RemoveSupernetValidatorTransactionTypeId)
    const reader = JuneoBuffer.from(data).createReader()
    reader.skip(baseTx)
    const nodeId = new NodeId(reader.read(NodeIdSize).toCB58())
    const supernetId = new SupernetId(reader.read(SupernetIdSize).toCB58())
    const supernetAuth = SupernetAuth.parse(reader.peekRemaining())
    reader.skip(supernetAuth)
    return new RemoveSupernetValidatorTransaction(
      baseTx.networkId,
      baseTx.blockchainId,
      baseTx.outputs,
      baseTx.inputs,
      baseTx.memo,
      nodeId,
      supernetId,
      supernetAuth
    )
  }
}

export class TransformSupernetTransaction extends BaseTransaction {
  supernetId: SupernetId
  assetId: AssetId
  initialRewardPoolSupply: bigint
  startRewardShare: bigint
  startRewardTime: bigint
  targetRewardShare: bigint
  targetRewardTime: bigint
  minValidatorStake: bigint
  maxValidatorStake: bigint
  minStakeDuration: number
  maxStakeDuration: number
  stakePeriodRewardShare: bigint
  minDelegationFee: number
  maxDelegationFee: number
  minDelegatorStake: bigint
  maxValidatorWeightFactor: number
  uptimeRequirement: number
  supernetAuth: SupernetAuth

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    supernetId: SupernetId,
    assetId: AssetId,
    initialRewardPoolSupply: bigint,
    startRewardShare: bigint,
    startRewardTime: bigint,
    targetRewardShare: bigint,
    targetRewardTime: bigint,
    minValidatorStake: bigint,
    maxValidatorStake: bigint,
    minStakeDuration: number,
    maxStakeDuration: number,
    stakePeriodRewardShare: bigint,
    minDelegationFee: number,
    maxDelegationFee: number,
    minDelegatorStake: bigint,
    maxValidatorWeightFactor: number,
    uptimeRequirement: number,
    supernetAuth: SupernetAuth
  ) {
    super(TransformSupernetTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.supernetId = supernetId
    this.assetId = assetId
    this.initialRewardPoolSupply = initialRewardPoolSupply
    this.startRewardShare = startRewardShare
    this.startRewardTime = startRewardTime
    this.targetRewardShare = targetRewardShare
    this.targetRewardTime = targetRewardTime
    this.minValidatorStake = minValidatorStake
    this.maxValidatorStake = maxValidatorStake
    this.minStakeDuration = minStakeDuration
    this.maxStakeDuration = maxStakeDuration
    this.stakePeriodRewardShare = stakePeriodRewardShare
    this.minDelegationFee = minDelegationFee
    this.maxDelegationFee = maxDelegationFee
    this.minDelegatorStake = minDelegatorStake
    this.maxValidatorWeightFactor = maxValidatorWeightFactor
    this.uptimeRequirement = uptimeRequirement
    this.supernetAuth = supernetAuth
  }

  getSignables (): Signable[] {
    return [...this.inputs, this.supernetAuth]
  }

  serialize (): JuneoBuffer {
    const baseTransaction = super.serialize()
    const supernetAuthBytes = this.supernetAuth.serialize()
    const buffer = JuneoBuffer.alloc(
      baseTransaction.length +
        SupernetIdSize +
        AssetIdSize +
        8 +
        8 +
        8 +
        8 +
        8 +
        8 +
        8 +
        4 +
        4 +
        8 +
        4 +
        4 +
        8 +
        1 +
        4 +
        supernetAuthBytes.length
    )
    buffer.write(baseTransaction)
    buffer.write(this.supernetId)
    buffer.write(this.assetId)
    buffer.writeUInt64(this.initialRewardPoolSupply)
    buffer.writeUInt64(this.startRewardShare)
    buffer.writeUInt64(this.startRewardTime)
    buffer.writeUInt64(this.targetRewardShare)
    buffer.writeUInt64(this.targetRewardTime)
    buffer.writeUInt64(this.minValidatorStake)
    buffer.writeUInt64(this.maxValidatorStake)
    buffer.writeUInt32(this.minStakeDuration)
    buffer.writeUInt32(this.maxStakeDuration)
    buffer.writeUInt64(this.stakePeriodRewardShare)
    buffer.writeUInt32(this.minDelegationFee)
    buffer.writeUInt32(this.maxDelegationFee)
    buffer.writeUInt64(this.minDelegatorStake)
    buffer.writeUInt8(this.maxValidatorWeightFactor)
    buffer.writeUInt32(this.uptimeRequirement)
    buffer.write(supernetAuthBytes)
    return buffer
  }
}

export class AddPermissionlessValidatorTransaction extends BaseTransaction {
  validator: Validator
  supernetId: SupernetId
  signer: BLSSigner
  stake: TransferableOutput[]
  validatorRewardsOwner: Secp256k1OutputOwners
  delegatorRewardsOwner: Secp256k1OutputOwners
  shares: number

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    validator: Validator,
    supernetId: SupernetId,
    signer: BLSSigner,
    stake: TransferableOutput[],
    validatorRewardsOwner: Secp256k1OutputOwners,
    delegatorRewardsOwner: Secp256k1OutputOwners,
    shares: number
  ) {
    super(AddPermissionlessValidatorTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.validator = validator
    this.supernetId = supernetId
    this.signer = signer
    this.stake = stake
    this.validatorRewardsOwner = validatorRewardsOwner
    this.delegatorRewardsOwner = delegatorRewardsOwner
    this.shares = shares
  }

  getOutputs (): TransferableOutput[] {
    const assetId = this.stake[0].assetId
    const validatorRewardsOutput = new TransferableOutput(assetId, this.validatorRewardsOwner)
    const delegatorRewardsOutput = new TransferableOutput(assetId, this.delegatorRewardsOwner)
    return [...this.outputs, ...this.stake, validatorRewardsOutput, delegatorRewardsOutput]
  }

  serialize (): JuneoBuffer {
    const baseTransaction = super.serialize()
    const signerBytes = this.signer.serialize()
    const stakeBytes: JuneoBuffer[] = []
    let stakeBytesSize = 0
    for (const output of this.stake) {
      const bytes: JuneoBuffer = output.serialize()
      stakeBytesSize += bytes.length
      stakeBytes.push(bytes)
    }
    const validatorRewardsOwnerBytes: JuneoBuffer = this.validatorRewardsOwner.serialize()
    const delegatorRewardsOwnerBytes: JuneoBuffer = this.delegatorRewardsOwner.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length +
        ValidatorSize +
        SupernetIdSize +
        signerBytes.length +
        4 +
        stakeBytesSize +
        validatorRewardsOwnerBytes.length +
        delegatorRewardsOwnerBytes.length +
        4
    )
    buffer.write(baseTransaction)
    buffer.write(this.validator)
    buffer.write(this.supernetId)
    buffer.write(signerBytes)
    buffer.writeUInt32(this.stake.length)
    for (const output of stakeBytes) {
      buffer.write(output)
    }
    buffer.write(validatorRewardsOwnerBytes)
    buffer.write(delegatorRewardsOwnerBytes)
    buffer.writeUInt32(this.shares)
    return buffer
  }

  static parse (data: string | JuneoBuffer): AddPermissionlessValidatorTransaction {
    const baseTx = BaseTransaction.parse(data, AddPermissionlessValidatorTransactionTypeId)
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    reader.skip(baseTx)
    const validator = Validator.parse(reader.read(ValidatorSize))
    const supernetId = new SupernetId(reader.read(SupernetIdSize).toCB58())
    const signer = PrimarySigner.parse(reader.read(PrimarySignerSize))
    const stakeLength = reader.readUInt32()
    const stakes: TransferableOutput[] = []
    for (let i = 0; i < stakeLength; i++) {
      const stake = TransferableOutput.parse(reader.peekRemaining())
      reader.skip(stake)
      stakes.push(stake)
    }
    const validatorRewardsOwner = Secp256k1OutputOwners.parse(reader.peekRemaining())
    reader.skip(validatorRewardsOwner)
    const delegatorRewardsOwner = Secp256k1OutputOwners.parse(reader.peekRemaining())
    reader.skip(delegatorRewardsOwner)
    const shares = reader.readUInt32()
    return new AddPermissionlessValidatorTransaction(
      baseTx.networkId,
      baseTx.blockchainId,
      baseTx.outputs,
      baseTx.inputs,
      baseTx.memo,
      validator,
      supernetId,
      signer,
      stakes,
      validatorRewardsOwner,
      delegatorRewardsOwner,
      shares
    )
  }
}

export class AddPermissionlessDelegatorTransaction extends BaseTransaction {
  validator: Validator
  supernetId: SupernetId
  stake: TransferableOutput[]
  delegatorRewardsOwner: Secp256k1OutputOwners

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    validator: Validator,
    supernetId: SupernetId,
    stake: TransferableOutput[],
    delegatorRewardsOwner: Secp256k1OutputOwners
  ) {
    super(AddPermissionlessDelegatorTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.validator = validator
    this.supernetId = supernetId
    this.stake = stake
    this.delegatorRewardsOwner = delegatorRewardsOwner
  }

  getOutputs (): TransferableOutput[] {
    const assetId = this.stake[0].assetId
    const delegatorRewardsOutput = new TransferableOutput(assetId, this.delegatorRewardsOwner)
    return [...this.outputs, ...this.stake, delegatorRewardsOutput]
  }

  serialize (): JuneoBuffer {
    const baseTransaction = super.serialize()
    const stakeBytes: JuneoBuffer[] = []
    let stakeBytesSize = 0
    for (const output of this.stake) {
      const bytes = output.serialize()
      stakeBytesSize += bytes.length
      stakeBytes.push(bytes)
    }
    const delegatorRewardsOwnerBytes = this.delegatorRewardsOwner.serialize()
    const buffer = JuneoBuffer.alloc(
      baseTransaction.length + ValidatorSize + SupernetIdSize + 4 + stakeBytesSize + delegatorRewardsOwnerBytes.length
    )
    buffer.write(baseTransaction)
    buffer.write(this.validator)
    buffer.write(this.supernetId)
    buffer.writeUInt32(this.stake.length)
    for (const output of stakeBytes) {
      buffer.write(output)
    }
    buffer.write(delegatorRewardsOwnerBytes)
    return buffer
  }

  static parse (data: string | JuneoBuffer): AddPermissionlessDelegatorTransaction {
    const baseTx = BaseTransaction.parse(data, AddPermissionlessDelegatorTransactionTypeId)
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    reader.skip(baseTx)
    const validator = Validator.parse(reader.read(ValidatorSize))
    const supernetId = new SupernetId(reader.read(SupernetIdSize).toCB58())
    const stakeLength = reader.readUInt32()
    const stakes: TransferableOutput[] = []
    for (let i = 0; i < stakeLength; i++) {
      const stake = TransferableOutput.parse(reader.peekRemaining())
      reader.skip(stake)
      stakes.push(stake)
    }
    const rewardsOwner = Secp256k1OutputOwners.parse(reader.readRemaining())
    return new AddPermissionlessDelegatorTransaction(
      baseTx.networkId,
      baseTx.blockchainId,
      baseTx.outputs,
      baseTx.inputs,
      baseTx.memo,
      validator,
      supernetId,
      stakes,
      rewardsOwner
    )
  }
}
