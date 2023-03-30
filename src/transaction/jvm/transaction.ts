import { type JVMAPI } from '../../api/jvm'
import { JuneoBuffer, sleep } from '../../utils'
import { type TransferableInput } from '../input'
import { type TransferableOutput } from '../output'
import { type Signable } from '../signature'
import { AbstractBaseTx } from '../transaction'
import { BlockchainIdSize, type BlockchainId } from '../types'

export enum JVMTransactionStatus {
  Accepted = 'Accepted',
  Processing = 'Processing',
  Rejected = 'Rejected',
  Unknown = 'Unknown'
}

export class JVMTransactionStatusFetcher {
  jvmApi: JVMAPI
  delay: number
  private attempts: number = 0
  maxAttempts: number
  transactionId: string
  currentStatus: string = JVMTransactionStatus.Unknown

  constructor (jvmApi: JVMAPI, delay: number, maxAttempts: number, transactionId: string) {
    this.jvmApi = jvmApi
    this.delay = delay
    this.maxAttempts = maxAttempts
    this.transactionId = transactionId
  }

  getAttemptsCount (): number {
    return this.attempts
  }

  async fetch (): Promise<string> {
    while (this.attempts < this.maxAttempts && this.currentStatus !== JVMTransactionStatus.Accepted) {
      this.currentStatus = (await this.jvmApi.getTxStatus(this.transactionId)).status
      await sleep(this.delay)
      this.attempts += 1
    }
    return this.currentStatus
  }
}

export class BaseTransaction extends AbstractBaseTx implements Signable {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string) {
    super(0x00000000, networkId, blockchainId, outputs, inputs, memo)
  }

  getUnsignedInputs (): TransferableInput[] {
    return this.inputs
  }
}

export class ExportTransaction extends AbstractBaseTx {
  destinationChain: BlockchainId
  exportedOutputs: TransferableOutput[]

  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    destinationChain: BlockchainId, exportedOutputs: TransferableOutput[]) {
    super(0x00000004, networkId, blockchainId, outputs, inputs, memo)
    this.destinationChain = destinationChain
    this.exportedOutputs = exportedOutputs
  }

  getUnsignedInputs (): TransferableInput[] {
    return this.inputs
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const exportedOutputsBytes: JuneoBuffer[] = []
    let exportedOutputsSize: number = 0
    this.exportedOutputs.forEach(output => {
      const bytes: JuneoBuffer = output.serialize()
      exportedOutputsSize += bytes.length
      exportedOutputsBytes.push(bytes)
    })
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length + BlockchainIdSize + exportedOutputsSize
    )
    buffer.write(baseTransaction)
    buffer.write(this.destinationChain.serialize())
    buffer.writeUInt32(this.exportedOutputs.length)
    exportedOutputsBytes.forEach(output => {
      buffer.write(output)
    })
    return buffer
  }
}

export class ImportTransaction extends AbstractBaseTx {
  sourceChain: BlockchainId
  importedInputs: TransferableInput[]

  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string,
    sourceChain: BlockchainId, importedInputs: TransferableInput[]) {
    super(0x00000003, networkId, blockchainId, outputs, inputs, memo)
    this.sourceChain = sourceChain
    this.importedInputs = importedInputs
  }

  getUnsignedInputs (): TransferableInput[] {
    return this.inputs.concat(this.importedInputs)
  }

  serialize (): JuneoBuffer {
    const baseTransaction: JuneoBuffer = super.serialize()
    const importedInputsBytes: JuneoBuffer[] = []
    let importedInputsSize: number = 0
    this.importedInputs.forEach(input => {
      const bytes: JuneoBuffer = input.serialize()
      importedInputsSize += bytes.length
      importedInputsBytes.push(bytes)
    })
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      baseTransaction.length + BlockchainIdSize + importedInputsSize
    )
    buffer.write(baseTransaction)
    buffer.write(this.sourceChain.serialize())
    buffer.writeUInt32(this.importedInputs.length)
    importedInputsBytes.forEach(input => {
      buffer.write(input)
    })
    return buffer
  }
}
