import { type RelayAPI } from '../../api/relay'
import { JuneoBuffer } from '../../utils/bytes'
import { sleep } from '../../utils/time'
import { TransferableInput } from '../input'
import { TransferableOutput } from '../output'
import { AbstractBaseTransaction, AbstractExportTransaction, AbstractImportTransaction } from '../transaction'
import { BlockchainIdSize, BlockchainId } from '../types'
import { Validator, Secp256k1OutputOwners } from './validation'

const ExportTransactionTypeId: number = 0x00000012
const ImportTransactionTypeId: number = 0x00000011
const AddValidatorTransactionTypeId: number = 0x0000000c
const AddDelegatorTransactionTypeId: number = 0x0000000e

export enum RelayTransactionStatus {
  Committed = 'Committed',
  Aborted = 'Aborted',
  Processing = 'Processing',
  Dropped = 'Dropped',
  Unknown = 'Unknown'
}

export class RelayTransactionStatusFetcher {
  relayApi: RelayAPI
  delay: number
  private attempts: number = 0
  maxAttempts: number
  transactionId: string
  currentStatus: string = RelayTransactionStatus.Unknown

  constructor (relayApi: RelayAPI, delay: number, maxAttempts: number, transactionId: string) {
    this.relayApi = relayApi
    this.delay = delay
    this.maxAttempts = maxAttempts
    this.transactionId = transactionId
  }

  getAttemptsCount (): number {
    return this.attempts
  }

  async fetch (): Promise<string> {
    while (this.attempts < this.maxAttempts && this.currentStatus !== RelayTransactionStatus.Committed) {
      this.currentStatus = (await this.relayApi.getTxStatus(this.transactionId)).status
      await sleep(this.delay)
      this.attempts += 1
    }
    return this.currentStatus
  }
}

export class RelayExportTransaction extends AbstractExportTransaction {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    destinationChain: BlockchainId, exportedOutputs: TransferableOutput[]) {
    super(ExportTransactionTypeId, networkId, blockchainId, outputs,
      inputs, memo, destinationChain, exportedOutputs)
  }
}

export class RelayImportTransaction extends AbstractImportTransaction {
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

  getUnsignedInputs (): TransferableInput[] {
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
      baseTransaction.length + 44 + 4 + stakeBytesSize + rewardsOwnerBytes.length + 4
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

  getUnsignedInputs (): TransferableInput[] {
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
      baseTransaction.length + 44 + 4 + stakeBytesSize + rewardsOwnerBytes.length
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
