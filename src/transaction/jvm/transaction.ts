import { JuneoBuffer } from '../../utils'
import { type TransferableInput } from '../input'
import { type TransferableOutput } from '../output'
import { type Signable } from '../signature'
import { AbstractBaseTransaction, AbstractExportTransaction, AbstractImportTransaction } from '../transaction'
import { type BlockchainId } from '../types'
import { type InitialState } from './operation'

const BaseTransactionTypeId: number = 0x00000000
const CreateAssetTransactionTypeId: number = 0x00000001
const ImportTransactionTypeId: number = 0x00000003
const ExportTransactionTypeId: number = 0x00000004

export class JVMBaseTransaction extends AbstractBaseTransaction {
  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string
  ) {
    super(BaseTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
  }

  getSignables (): Signable[] {
    return this.inputs
  }
}

export class JVMExportTransaction extends AbstractExportTransaction {
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

export class JVMImportTransaction extends AbstractImportTransaction {
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

export class CreateAssetTransaction extends AbstractBaseTransaction {
  name: string
  symbol: string
  denomination: number
  initialStates: InitialState[]

  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    name: string,
    symbol: string,
    denomination: number,
    initialStates: InitialState[]
  ) {
    super(CreateAssetTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
    this.name = name
    this.symbol = symbol
    this.denomination = denomination
    this.initialStates = initialStates
  }

  getSignables (): Signable[] {
    return this.inputs
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const initialStatesBytes: JuneoBuffer[] = []
    let initialStatesBytesSize: number = 0
    for (const state of this.initialStates) {
      const bytes: JuneoBuffer = state.serialize()
      initialStatesBytesSize += bytes.length
      initialStatesBytes.push(bytes)
    }
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length + 2 + this.name.length + 2 + this.symbol.length + 1 + 4 + initialStatesBytesSize
    )
    buffer.write(baseTransaction)
    buffer.writeUInt16(this.name.length)
    buffer.writeString(this.name)
    buffer.writeUInt16(this.symbol.length)
    buffer.writeString(this.symbol)
    buffer.writeUInt8(this.denomination)
    buffer.writeUInt32(this.initialStates.length)
    for (const bytes of initialStatesBytes) {
      buffer.write(bytes)
    }
    return buffer
  }
}
