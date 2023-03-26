import { type Buffer } from 'buffer'
import { JuneoBuffer } from '../../utils'
import { type VMWallet } from '../../wallet'
import { type TransferableInput } from '../input'
import { type TransferableOutput } from '../output'
import { Secp256k1Credentials, type Signable } from '../signature'
import { AbstractBaseTx } from '../transaction'
import { type Address, Signature, type BlockchainId } from '../types'

export class BaseTransaction extends AbstractBaseTx implements Signable {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string) {
    super(0x00000000, networkId, blockchainId, outputs, inputs, memo)
  }

  sign (wallets: VMWallet[]): JuneoBuffer {
    const bytes: Buffer = this.serialize().toBytes()
    const credentials: JuneoBuffer[] = []
    let credentialsSize: number = 0
    this.inputs.forEach(input => {
      const indices: number[] = input.input.addressIndices
      const signatures: Signature[] = []
      indices.forEach(indice => {
        const address: Address = input.input.utxo.output.addresses[indice]
        for (let i = 0; i < wallets.length; i++) {
          const wallet: VMWallet = wallets[i]
          if (address.matches(wallet.getAddress())) {
            signatures.push(new Signature(wallet.sign(bytes)))
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
}
