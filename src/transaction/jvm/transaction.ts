import { type TransferableInput } from '../input'
import { type TransferableOutput } from '../output'
import { type Signable } from '../signature'
import { AbstractBaseTx } from '../transaction'
import { type BlockchainId } from '../types'

export class BaseTransaction extends AbstractBaseTx implements Signable {
  constructor (networkId: number, blockchainId: BlockchainId,
    outputs: TransferableOutput[], inputs: TransferableInput[], memo: string) {
    super(0x00000000, networkId, blockchainId, outputs, inputs, memo)
  }

  getUnsignedInputs (): TransferableInput[] {
    return this.inputs
  }
}
