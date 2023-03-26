import { JuneoBuffer, type Serializable } from '../utils'
import { type VMWallet } from '../wallet/wallet'
import { TransferableInput } from './input'
import { TransferableOutput } from './output'
import { type BlockchainId, BlockchainIdSize } from './types'

export const CodecId: number = 0

export interface UnsignedTransaction {
  codecId: number
  typeId: number
  networkId: number
  blockchainId: BlockchainId
  outputs: TransferableOutput[]
  inputs: TransferableInput[]
  memo: string
  sign: (wallets: VMWallet[]) => JuneoBuffer
}

export abstract class AbstractBaseTx implements UnsignedTransaction, Serializable {
  codecId: number
  typeId: number
  networkId: number
  blockchainId: BlockchainId
  outputs: TransferableOutput[]
  inputs: TransferableInput[]
  memo: string

  constructor (typeId: number, networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string) {
    this.codecId = CodecId
    this.typeId = typeId
    this.networkId = networkId
    this.blockchainId = blockchainId
    this.outputs = outputs
    this.outputs.sort(TransferableOutput.comparator)
    this.inputs = inputs
    this.inputs.sort(TransferableInput.comparator)
    this.memo = memo
  }

  abstract sign (wallets: VMWallet[]): JuneoBuffer

  serialize (): JuneoBuffer {
    const outputsBytes: JuneoBuffer[] = []
    let outputsSize: number = 0
    this.outputs.forEach(output => {
      const bytes: JuneoBuffer = output.serialize()
      outputsSize += bytes.length
      outputsBytes.push(bytes)
    })
    const inputsBytes: JuneoBuffer[] = []
    let inputsSize: number = 0
    this.inputs.forEach(input => {
      const bytes: JuneoBuffer = input.serialize()
      inputsSize += bytes.length
      inputsBytes.push(bytes)
    })
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      // 2 + 4 + 4 + 4 + 4 + 4 = 22
      22 + BlockchainIdSize + outputsSize + inputsSize + this.memo.length
    )
    buffer.writeUInt16(this.codecId)
    buffer.writeUInt32(this.typeId)
    buffer.writeUInt32(this.networkId)
    buffer.write(this.blockchainId.serialize())
    buffer.writeUInt32(this.outputs.length)
    outputsBytes.forEach(output => {
      buffer.write(output)
    })
    buffer.writeUInt32(this.inputs.length)
    inputsBytes.forEach(input => {
      buffer.write(input)
    })
    buffer.writeUInt32(this.memo.length)
    buffer.writeString(this.memo)
    return buffer
  }
}
