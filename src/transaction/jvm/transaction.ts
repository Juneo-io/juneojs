import { JuneoBuffer } from '../../utils'
import {
  CreateAssetTransactionTypeId,
  JVMBaseTransactionTypeId,
  JVMExportTransactionTypeId,
  JVMImportTransactionTypeId
} from '../constants'
import { type TransferableInput } from '../input'
import { type TransferableOutput } from '../output'
import { BaseTransaction, ExportTransaction, ImportTransaction } from '../transaction'
import { type BlockchainId } from '../types'
import { type InitialState } from './operation'

export class JVMBaseTransaction extends BaseTransaction {
  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string
  ) {
    super(JVMBaseTransactionTypeId, networkId, blockchainId, outputs, inputs, memo)
  }

  static parse (data: string | JuneoBuffer): JVMBaseTransaction {
    return BaseTransaction.parse(data, JVMBaseTransactionTypeId)
  }
}

export class JVMExportTransaction extends ExportTransaction {
  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    destinationChain: BlockchainId,
    exportedOutputs: TransferableOutput[]
  ) {
    super(JVMExportTransactionTypeId, networkId, blockchainId, outputs, inputs, memo, destinationChain, exportedOutputs)
  }

  static parse (data: string | JuneoBuffer): JVMExportTransaction {
    return ExportTransaction.parse(data, JVMExportTransactionTypeId)
  }
}

export class JVMImportTransaction extends ImportTransaction {
  constructor (
    networkId: number,
    blockchainId: BlockchainId,
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: string,
    sourceChain: BlockchainId,
    importedInputs: TransferableInput[]
  ) {
    super(JVMImportTransactionTypeId, networkId, blockchainId, outputs, inputs, memo, sourceChain, importedInputs)
  }

  static parse (data: string | JuneoBuffer): JVMImportTransaction {
    return ImportTransaction.parse(data, JVMImportTransactionTypeId)
  }
}

export class CreateAssetTransaction extends BaseTransaction {
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
