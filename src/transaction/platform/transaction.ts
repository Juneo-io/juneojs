import { JuneoBuffer } from '../../utils'
import { TransferableInput } from '../input'
import { TransferableOutput } from '../output'
import { type Signable } from '../signature'
import { AbstractBaseTransaction, AbstractExportTransaction, AbstractImportTransaction } from '../transaction'
import {
  BlockchainIdSize,
  BlockchainId,
  type SupernetId,
  SupernetIdSize,
  type DynamicId,
  DynamicIdSize,
  type AssetId,
  type Address,
  AssetIdSize,
  type NodeId,
  NodeIdSize
} from '../types'
import { SupernetAuth, type BLSSigner } from './supernet'
import { Validator, Secp256k1OutputOwners } from './validation'

const AddValidatorTransactionTypeId: number = 0x0000000c
const AddSupernetValidatorTransactionType: number = 0x0000000d
const AddDelegatorTransactionTypeId: number = 0x0000000e
const CreateChainTransactionTypeId: number = 0x0000000f
const CreateSupernetTransactionTypeId: number = 0x00000010
const ImportTransactionTypeId: number = 0x00000011
const ExportTransactionTypeId: number = 0x00000012
const RemoveSupernetTransactionTypeId: number = 0x00000017
const TransformSupernetTransactionTypeId: number = 0x00000018
const AddPermissionlessValidatorTransactionTypeId: number = 0x00000019
const AddPermissionlessDelegatorTransactionTypeId: number = 0x0000001a

export class PlatformExportTransaction extends AbstractExportTransaction {
  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    destinationChain: BlockchainId,
    exportedOutputs: TransferableOutput[]
  ) {
    super(ExportTransactionTypeId, networkId, blockchainId, outputs, inputs, memo, destinationChain, exportedOutputs)
  }
}

export class PlatformImportTransaction extends AbstractImportTransaction {
  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    sourceChain: BlockchainId,
    importedInputs: TransferableInput[]
  ) {
    super(ImportTransactionTypeId, networkId, blockchainId, outputs, inputs, memo, sourceChain, importedInputs)
  }
}

export class AddValidatorTransaction extends AbstractBaseTransaction {
  validator: Validator
  stake: TransferableOutput[]
  rewardsOwner: Secp256k1OutputOwners
  shares: number

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    validator: Validator,
    stake: TransferableOutput[],
    rewardsOwner: Secp256k1OutputOwners,
    shares: number
  ) {
    super(AddValidatorTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.validator = validator
    this.stake = stake
    this.rewardsOwner = rewardsOwner
    this.shares = shares
  }

  getSignables (): Signable[] {
    return this.inputs
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const stakeBytes: JuneoBuffer[] = []
    let stakeBytesSize: number = 0
    this.stake.forEach((output) => {
      const bytes: JuneoBuffer = output.serialize()
      stakeBytesSize += bytes.length
      stakeBytes.push(bytes)
    })
    const rewardsOwnerBytes: JuneoBuffer = this.rewardsOwner.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length + Validator.Size + 4 + stakeBytesSize + rewardsOwnerBytes.length + 4
    )
    buffer.write(baseTransaction)
    buffer.write(this.validator.serialize())
    buffer.writeUInt32(this.stake.length)
    stakeBytes.forEach((output) => {
      buffer.write(output)
    })
    buffer.write(rewardsOwnerBytes)
    buffer.writeUInt32(this.shares)
    return buffer
  }

  static parse (data: string): AddValidatorTransaction {
    const buffer: JuneoBuffer = JuneoBuffer.fromString(data)
    // start at 2 + 4 to skip codec and type id reading
    let position: number = 6
    const networkId: number = buffer.readUInt32(position)
    position += 4
    const blockchainId: BlockchainId = new BlockchainId(buffer.read(position, BlockchainIdSize).toCB58())
    position += BlockchainIdSize
    const outputsLength: number = buffer.readUInt32(position)
    position += 4
    const outputs: TransferableOutput[] = []
    for (let i: number = 0; i < outputsLength; i++) {
      const output: TransferableOutput = TransferableOutput.parse(buffer.read(position, buffer.length - position))
      position += output.serialize().length
      outputs.push(output)
    }
    const inputsLength: number = buffer.readUInt32(position)
    position += 4
    const inputs: TransferableInput[] = []
    for (let i: number = 0; i < inputsLength; i++) {
      const input: TransferableInput = TransferableInput.parse(buffer.read(position, buffer.length - position))
      position += input.serialize().length
      inputs.push(input)
    }
    const memoLength: number = buffer.readUInt32(position)
    position += 4
    const memo: string = memoLength > 0 ? String(buffer.read(position, memoLength)) : ''
    position += memoLength
    const validator: Validator = Validator.parse(buffer.read(position, buffer.length - position))
    position += Validator.Size
    const stakeLength: number = buffer.readUInt32(position)
    position += 4
    const stakes: TransferableOutput[] = []
    for (let i: number = 0; i < stakeLength; i++) {
      const stake: TransferableOutput = TransferableOutput.parse(buffer.read(position, buffer.length - position))
      position += stake.serialize().length
      stakes.push(stake)
    }
    const rewardsOwner: Secp256k1OutputOwners = Secp256k1OutputOwners.parse(
      buffer.read(position, buffer.length - position)
    )
    position += rewardsOwner.serialize().length
    const shares: number = buffer.readUInt32(position)
    return new AddValidatorTransaction(
      networkId,
      blockchainId,
      outputs,
      inputs,
      memo,
      validator,
      stakes,
      rewardsOwner,
      shares
    )
  }
}

export class AddDelegatorTransaction extends AbstractBaseTransaction {
  validator: Validator
  stake: TransferableOutput[]
  rewardsOwner: Secp256k1OutputOwners

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    validator: Validator,
    stake: TransferableOutput[],
    rewardsOwner: Secp256k1OutputOwners
  ) {
    super(AddDelegatorTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.validator = validator
    this.stake = stake
    this.rewardsOwner = rewardsOwner
  }

  getSignables (): Signable[] {
    return this.inputs
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const stakeBytes: JuneoBuffer[] = []
    let stakeBytesSize: number = 0
    this.stake.forEach((output) => {
      const bytes: JuneoBuffer = output.serialize()
      stakeBytesSize += bytes.length
      stakeBytes.push(bytes)
    })
    const rewardsOwnerBytes: JuneoBuffer = this.rewardsOwner.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length + Validator.Size + 4 + stakeBytesSize + rewardsOwnerBytes.length
    )
    buffer.write(baseTransaction)
    buffer.write(this.validator.serialize())
    buffer.writeUInt32(this.stake.length)
    stakeBytes.forEach((output) => {
      buffer.write(output)
    })
    buffer.write(rewardsOwnerBytes)
    return buffer
  }

  static parse (data: string): AddDelegatorTransaction {
    const buffer: JuneoBuffer = JuneoBuffer.fromString(data)
    // start at 2 + 4 to skip codec and type id reading
    let position: number = 6
    const networkId: number = buffer.readUInt32(position)
    position += 4
    const blockchainId: BlockchainId = new BlockchainId(buffer.read(position, BlockchainIdSize).toCB58())
    position += BlockchainIdSize
    const outputsLength: number = buffer.readUInt32(position)
    position += 4
    const outputs: TransferableOutput[] = []
    for (let i: number = 0; i < outputsLength; i++) {
      const output: TransferableOutput = TransferableOutput.parse(buffer.read(position, buffer.length - position))
      position += output.serialize().length
      outputs.push(output)
    }
    const inputsLength: number = buffer.readUInt32(position)
    position += 4
    const inputs: TransferableInput[] = []
    for (let i: number = 0; i < inputsLength; i++) {
      const input: TransferableInput = TransferableInput.parse(buffer.read(position, buffer.length - position))
      position += input.serialize().length
      inputs.push(input)
    }
    const memoLength: number = buffer.readUInt32(position)
    position += 4
    const memo: string = memoLength > 0 ? String(buffer.read(position, memoLength)) : ''
    position += memoLength
    const validator: Validator = Validator.parse(buffer.read(position, buffer.length - position))
    position += Validator.Size
    const stakeLength: number = buffer.readUInt32(position)
    position += 4
    const stakes: TransferableOutput[] = []
    for (let i: number = 0; i < stakeLength; i++) {
      const stake: TransferableOutput = TransferableOutput.parse(buffer.read(position, buffer.length - position))
      position += stake.serialize().length
      stakes.push(stake)
    }
    const rewardsOwner: Secp256k1OutputOwners = Secp256k1OutputOwners.parse(
      buffer.read(position, buffer.length - position)
    )
    return new AddDelegatorTransaction(networkId, blockchainId, outputs, inputs, memo, validator, stakes, rewardsOwner)
  }
}

export class AddSupernetValidatorTransaction extends AbstractBaseTransaction {
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
    super(AddSupernetValidatorTransactionType, networkId, blockchainId, outputs, inputs, memo)
    this.validator = validator
    this.supernetId = supernetId
    this.supernetAuth = supernetAuth
  }

  getSignables (): Signable[] {
    return [...this.inputs, this.supernetAuth]
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const supernetAuthBytes: JuneoBuffer = this.supernetAuth.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length + Validator.Size + SupernetIdSize + supernetAuthBytes.length
    )
    buffer.write(baseTransaction)
    buffer.write(this.validator.serialize())
    buffer.write(this.supernetId.serialize())
    buffer.write(supernetAuthBytes)
    return buffer
  }
}

export class CreateSupernetTransaction extends AbstractBaseTransaction {
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

  getSignables (): Signable[] {
    return this.inputs
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const rewardsOwnerBytes: JuneoBuffer = this.rewardsOwner.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(baseTransaction.length + rewardsOwnerBytes.length)
    buffer.write(baseTransaction)
    buffer.write(rewardsOwnerBytes)
    return buffer
  }

  static parse (data: string): CreateSupernetTransaction {
    const buffer: JuneoBuffer = JuneoBuffer.fromString(data)
    // start at 2 + 4 to skip codec and type id reading
    let position: number = 6
    const networkId: number = buffer.readUInt32(position)
    position += 4
    const blockchainId: BlockchainId = new BlockchainId(buffer.read(position, BlockchainIdSize).toCB58())
    position += BlockchainIdSize
    const outputsLength: number = buffer.readUInt32(position)
    position += 4
    const outputs: TransferableOutput[] = []
    for (let i: number = 0; i < outputsLength; i++) {
      const output: TransferableOutput = TransferableOutput.parse(buffer.read(position, buffer.length - position))
      position += output.serialize().length
      outputs.push(output)
    }
    const inputsLength: number = buffer.readUInt32(position)
    position += 4
    const inputs: TransferableInput[] = []
    for (let i: number = 0; i < inputsLength; i++) {
      const input: TransferableInput = TransferableInput.parse(buffer.read(position, buffer.length - position))
      position += input.serialize().length
      inputs.push(input)
    }
    const memoLength: number = buffer.readUInt32(position)
    position += 4
    const memo: string = memoLength > 0 ? String(buffer.read(position, memoLength)) : ''
    position += memoLength
    const rewardsOwner: Secp256k1OutputOwners = Secp256k1OutputOwners.parse(
      buffer.read(position, buffer.length - position)
    )
    return new CreateSupernetTransaction(networkId, blockchainId, outputs, inputs, memo, rewardsOwner)
  }
}

export class CreateChainTransaction extends AbstractBaseTransaction {
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
    const baseTransaction: JuneoBuffer = super.serialize()
    const supernetAuthBytes: JuneoBuffer = this.supernetAuth.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
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
    buffer.write(this.supernetId.serialize())
    buffer.writeUInt16(this.name.length)
    buffer.writeString(this.name)
    buffer.write(this.chainAssetId.serialize())
    buffer.write(this.vmId.serialize())
    buffer.writeUInt32(this.fxIds.length)
    this.fxIds.forEach((fxId) => {
      buffer.write(fxId.serialize())
    })
    buffer.writeUInt32(this.genesisData.length)
    buffer.writeString(this.genesisData)
    buffer.write(supernetAuthBytes)
    return buffer
  }
}

export class RemoveSupernetValidatorTransaction extends AbstractBaseTransaction {
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
    super(RemoveSupernetTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.nodeId = nodeId
    this.supernetId = supernetId
    this.supernetAuth = supernetAuth
  }

  getSignables (): Signable[] {
    return [...this.inputs, this.supernetAuth]
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const supernetAuthBytes: JuneoBuffer = this.supernetAuth.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length + NodeIdSize + SupernetIdSize + supernetAuthBytes.length
    )
    buffer.write(baseTransaction)
    buffer.write(this.nodeId.serialize())
    buffer.write(this.supernetId.serialize())
    buffer.write(supernetAuthBytes)
    return buffer
  }
}

export class TransformSupernetTransaction extends AbstractBaseTransaction {
  supernetId: SupernetId
  assetId: AssetId
  initialSupply: bigint
  maximumSupply: bigint
  minConsumptionRate: bigint
  maxConsumptionRate: bigint
  minValidatorStake: bigint
  maxValidatorStake: bigint
  minStakeDuration: number
  maxStakeDuration: number
  minDelegationFee: number
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
    initialSupply: bigint,
    maximumSupply: bigint,
    minConsumptionRate: bigint,
    maxConsumptionRate: bigint,
    minValidatorStake: bigint,
    maxValidatorStake: bigint,
    minStakeDuration: number,
    maxStakeDuration: number,
    minDelegationFee: number,
    minDelegatorStake: bigint,
    maxValidatorWeightFactor: number,
    uptimeRequirement: number,
    supernetAuth: SupernetAuth
  ) {
    super(TransformSupernetTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.supernetId = supernetId
    this.assetId = assetId
    this.initialSupply = initialSupply
    this.maximumSupply = maximumSupply
    this.minConsumptionRate = minConsumptionRate
    this.maxConsumptionRate = maxConsumptionRate
    this.minValidatorStake = minValidatorStake
    this.maxValidatorStake = maxValidatorStake
    this.minStakeDuration = minStakeDuration
    this.maxStakeDuration = maxStakeDuration
    this.minDelegationFee = minDelegationFee
    this.minDelegatorStake = minDelegatorStake
    this.maxValidatorWeightFactor = maxValidatorWeightFactor
    this.uptimeRequirement = uptimeRequirement
    this.supernetAuth = supernetAuth
  }

  getSignables (): Signable[] {
    return [...this.inputs, this.supernetAuth]
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const supernetAuthBytes: JuneoBuffer = this.supernetAuth.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length +
        SupernetIdSize +
        AssetIdSize +
        8 +
        8 +
        8 +
        8 +
        8 +
        8 +
        4 +
        4 +
        4 +
        8 +
        1 +
        4 +
        supernetAuthBytes.length
    )
    buffer.write(baseTransaction)
    buffer.write(this.supernetId.serialize())
    buffer.write(this.assetId.serialize())
    buffer.writeUInt64(this.initialSupply)
    buffer.writeUInt64(this.maximumSupply)
    buffer.writeUInt64(this.minConsumptionRate)
    buffer.writeUInt64(this.maxConsumptionRate)
    buffer.writeUInt64(this.minValidatorStake)
    buffer.writeUInt64(this.maxValidatorStake)
    buffer.writeUInt32(this.minStakeDuration)
    buffer.writeUInt32(this.maxStakeDuration)
    buffer.writeUInt32(this.minDelegationFee)
    buffer.writeUInt64(this.minDelegatorStake)
    buffer.writeUInt8(this.maxValidatorWeightFactor)
    buffer.writeUInt32(this.uptimeRequirement)
    buffer.write(supernetAuthBytes)
    return buffer
  }
}

export class AddPermissionlessValidatorTransaction extends AbstractBaseTransaction {
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

  getSignables (): Signable[] {
    return this.inputs
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const signerBytes: JuneoBuffer = this.signer.serialize()
    const stakeBytes: JuneoBuffer[] = []
    let stakeBytesSize: number = 0
    this.stake.forEach((output) => {
      const bytes: JuneoBuffer = output.serialize()
      stakeBytesSize += bytes.length
      stakeBytes.push(bytes)
    })
    const validatorRewardsOwnerBytes: JuneoBuffer = this.validatorRewardsOwner.serialize()
    const delegatorRewardsOwnerBytes: JuneoBuffer = this.delegatorRewardsOwner.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length +
        Validator.Size +
        SupernetIdSize +
        signerBytes.length +
        4 +
        stakeBytesSize +
        validatorRewardsOwnerBytes.length +
        delegatorRewardsOwnerBytes.length +
        4
    )
    buffer.write(baseTransaction)
    buffer.write(this.validator.serialize())
    buffer.write(this.supernetId.serialize())
    buffer.write(signerBytes)
    buffer.writeUInt32(this.stake.length)
    stakeBytes.forEach((output) => {
      buffer.write(output)
    })
    buffer.write(validatorRewardsOwnerBytes)
    buffer.write(delegatorRewardsOwnerBytes)
    buffer.writeUInt32(this.shares)
    return buffer
  }
}

export class AddPermissionlessDelegatorTransaction extends AbstractBaseTransaction {
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

  getSignables (): Signable[] {
    return this.inputs
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const stakeBytes: JuneoBuffer[] = []
    let stakeBytesSize: number = 0
    this.stake.forEach((output) => {
      const bytes: JuneoBuffer = output.serialize()
      stakeBytesSize += bytes.length
      stakeBytes.push(bytes)
    })
    const delegatorRewardsOwnerBytes: JuneoBuffer = this.delegatorRewardsOwner.serialize()
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length + Validator.Size + SupernetIdSize + 4 + stakeBytesSize + delegatorRewardsOwnerBytes.length
    )
    buffer.write(baseTransaction)
    buffer.write(this.validator.serialize())
    buffer.write(this.supernetId.serialize())
    buffer.writeUInt32(this.stake.length)
    stakeBytes.forEach((output) => {
      buffer.write(output)
    })
    buffer.write(delegatorRewardsOwnerBytes)
    return buffer
  }
}
