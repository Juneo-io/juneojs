import { type TransferableInput } from '../input'
import { type TransferableOutput } from '../output'
import { type Signable } from '../signature'
import { AbstractBaseTransaction, AbstractExportTransaction, AbstractImportTransaction } from '../transaction'
import { type BlockchainId } from '../types'

const BaseTransactionTypeId: number = 0x00000000
const ExportTransactionTypeId: number = 0x00000004
const ImportTransactionTypeId: number = 0x00000003

export class BaseTransaction extends AbstractBaseTransaction {
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
