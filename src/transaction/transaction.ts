import { type Buffer } from 'buffer/'
import { JuneoBuffer, sha256, type Serializable } from '../utils'
import { type VMWallet } from '../wallet/wallet'
import { TransferableInput } from './input'
import { TransferableOutput } from './output'
import { Secp256k1Credentials } from './signature'
import { type BlockchainId, BlockchainIdSize, Signature, type Address } from './types'

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
  getUnsignedInputs: () => TransferableInput[]
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

  abstract getUnsignedInputs (): TransferableInput[]

  sign (wallets: VMWallet[]): JuneoBuffer {
    const bytes: Buffer = this.serialize().toBytes()
    const credentials: JuneoBuffer[] = []
    let credentialsSize: number = 0
    this.getUnsignedInputs().forEach(input => {
      const indices: number[] = input.input.addressIndices
      const signatures: Signature[] = []
      indices.forEach(indice => {
        const address: Address = input.input.utxo.output.addresses[indice]
        for (let i = 0; i < wallets.length; i++) {
          const wallet: VMWallet = wallets[i]
          if (address.matches(wallet.getAddress())) {
            signatures.push(new Signature(wallet.sign(sha256(bytes))))
            break
          }
        }
      })
      const credential: JuneoBuffer = new Secp256k1Credentials(signatures).serialize()
      credentialsSize += credential.length
      credentials.push(credential)
    })
    const buffer: JuneoBuffer = JuneoBuffer.alloc(
      bytes.length + 4 + credentialsSize
    )
    buffer.writeBuffer(bytes)
    buffer.writeUInt32(credentials.length)
    credentials.forEach(credential => {
      buffer.write(credential)
    })
    return buffer
  }

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
