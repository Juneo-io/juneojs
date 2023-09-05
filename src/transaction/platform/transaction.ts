import { type PlatformAPI } from '../../api/platform'
import { JuneoBuffer } from '../../utils/bytes'
import { sleep } from '../../utils/time'
import { TransferableInput } from '../input'
import { TransferableOutput } from '../output'
import { type Signable } from '../signature'
import { AbstractBaseTransaction, AbstractExportTransaction, AbstractImportTransaction, TransactionStatusFetchDelay, type TransactionStatusFetcher } from '../transaction'
import { BlockchainIdSize, BlockchainId, type SupernetId, SupernetIdSize, type DynamicId, DynamicIdSize, type AssetId, type Address, AssetIdSize } from '../types'
import { Validator, Secp256k1OutputOwners, SupernetAuth } from './validation'

const CreateSupernetTransactionTypeId: number = 0x00000010
const ImportTransactionTypeId: number = 0x00000011
const ExportTransactionTypeId: number = 0x00000012
const AddValidatorTransactionTypeId: number = 0x0000000c
const AddSupernetValidatorTransactionType: number = 0x0000000d
const AddDelegatorTransactionTypeId: number = 0x0000000e
const CreateChainTransactionTypeId: number = 0x0000000f

export enum PlatformTransactionStatus {
  Committed = 'Committed',
  Aborted = 'Aborted',
  Processing = 'Processing',
  Dropped = 'Dropped',
  Unknown = 'Unknown'
}

export class PlatformTransactionStatusFetcher implements TransactionStatusFetcher {
  platformApi: PlatformAPI
  private attempts: number = 0
  transactionId: string
  currentStatus: string = PlatformTransactionStatus.Unknown

  constructor (platformApi: PlatformAPI, transactionId: string) {
    this.platformApi = platformApi
    this.transactionId = transactionId
  }

  async fetch (timeout: number, delay: number = TransactionStatusFetchDelay): Promise<string> {
    const maxAttempts: number = timeout / delay
    while (this.attempts < maxAttempts && !this.isCurrentStatusSettled()) {
      await sleep(delay)
      this.currentStatus = (await this.platformApi.getTxStatus(this.transactionId)).status
      this.attempts += 1
    }
    return this.currentStatus
  }

  private isCurrentStatusSettled (): boolean {
    return this.currentStatus !== PlatformTransactionStatus.Unknown && this.currentStatus !== PlatformTransactionStatus.Processing
  }
}

export class PlatformExportTransaction extends AbstractExportTransaction {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    destinationChain: BlockchainId, exportedOutputs: TransferableOutput[]) {
    super(ExportTransactionTypeId, networkId, blockchainId, outputs,
      inputs, memo, destinationChain, exportedOutputs)
  }
}

export class PlatformImportTransaction extends AbstractImportTransaction {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    sourceChain: BlockchainId, importedInputs: TransferableInput[]) {
    super(ImportTransactionTypeId, networkId, blockchainId, outputs,
      inputs, memo, sourceChain, importedInputs)
  }
}

export class AddValidatorTransaction extends AbstractBaseTransaction {
  validator: Validator
  stake: TransferableOutput[]
  rewardsOwner: Secp256k1OutputOwners
  shares: number

  constructor (networkId: number, blockchainId: BlockchainId, outputs: TransferableOutput[], inputs: TransferableInput[],
    memo: string, validator: Validator, stake: TransferableOutput[], rewardsOwner: Secp256k1OutputOwners, shares: number) {
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
    this.stake.forEach(output => {
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
    stakeBytes.forEach(output => {
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
    const memo: string = memoLength > 0
      ? String(buffer.read(position, memoLength))
      : ''
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
    const rewardsOwner: Secp256k1OutputOwners = Secp256k1OutputOwners.parse(buffer.read(position, buffer.length - position))
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

  constructor (networkId: number, blockchainId: BlockchainId, outputs: TransferableOutput[], inputs: TransferableInput[],
    memo: string, validator: Validator, stake: TransferableOutput[], rewardsOwner: Secp256k1OutputOwners) {
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
    this.stake.forEach(output => {
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
    stakeBytes.forEach(output => {
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
    const memo: string = memoLength > 0
      ? String(buffer.read(position, memoLength))
      : ''
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
    const rewardsOwner: Secp256k1OutputOwners = Secp256k1OutputOwners.parse(buffer.read(position, buffer.length - position))
    return new AddDelegatorTransaction(
      networkId,
      blockchainId,
      outputs,
      inputs,
      memo,
      validator,
      stakes,
      rewardsOwner
    )
  }
}

export class AddSupernetValidatorTransaction extends AbstractBaseTransaction {
  validator: Validator
  supernetId: SupernetId
  supernetAuth: SupernetAuth

  constructor (networkId: number, blockchainId: BlockchainId, outputs: TransferableOutput[], inputs: TransferableInput[],
    memo: string, validator: Validator, supernetId: SupernetId, supernetAuth: SupernetAuth) {
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

  constructor (networkId: number, blockchainId: BlockchainId, outputs: TransferableOutput[],
    inputs: TransferableInput[], memo: string, rewardsOwner: Secp256k1OutputOwners) {
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
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length + rewardsOwnerBytes.length
    )
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
    const memo: string = memoLength > 0
      ? String(buffer.read(position, memoLength))
      : ''
    position += memoLength
    const rewardsOwner: Secp256k1OutputOwners = Secp256k1OutputOwners.parse(buffer.read(position, buffer.length - position))
    return new CreateSupernetTransaction(
      networkId,
      blockchainId,
      outputs,
      inputs,
      memo,
      rewardsOwner
    )
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

  constructor (networkId: number, blockchainId: BlockchainId, outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    supernetId: SupernetId, name: string, chainAssetId: AssetId, vmId: DynamicId, fxIds: DynamicId[], genesisData: string, supernetAuth: SupernetAuth) {
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
      baseTransaction.length + SupernetIdSize + 2 + this.name.length + AssetIdSize + DynamicIdSize +
      4 + DynamicIdSize * this.fxIds.length + 4 + this.genesisData.length + supernetAuthBytes.length
    )
    buffer.write(baseTransaction)
    buffer.write(this.supernetId.serialize())
    buffer.writeUInt16(this.name.length)
    buffer.writeString(this.name)
    buffer.write(this.chainAssetId.serialize())
    buffer.write(this.vmId.serialize())
    buffer.writeUInt32(this.fxIds.length)
    this.fxIds.forEach(fxId => {
      buffer.write(fxId.serialize())
    })
    buffer.writeUInt32(this.genesisData.length)
    buffer.writeString(this.genesisData)
    buffer.write(supernetAuthBytes)
    return buffer
  }
}
