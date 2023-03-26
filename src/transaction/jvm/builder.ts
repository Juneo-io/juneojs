import { buildTransactionInputs, buildTransactionOutputs } from '../builder'
import { type TransferableInput, type UserInput } from '../input'
import { type Utxo } from '../utxo'
import { BaseTransaction } from './transaction'
import { Address, BlockchainId } from '../types'
import { type TransferableOutput } from '../output'

export function buildBaseTransaction (userInputs: UserInput[], utxoSet: Utxo[],
  sendersAddresses: string[], fees: bigint, changeAddress: string,
  networkId: number, blockchainId: string, memo?: string): BaseTransaction {
  const signersAddresses: Address[] = []
  sendersAddresses.forEach(senderAddress => {
    signersAddresses.push(new Address(senderAddress))
  })
  const inputs: TransferableInput[] = buildTransactionInputs(userInputs, utxoSet, signersAddresses, fees)
  const outputs: TransferableOutput[] = buildTransactionOutputs(userInputs, inputs, fees, changeAddress)
  return new BaseTransaction(
    networkId,
    new BlockchainId(blockchainId),
    outputs,
    inputs,
    memo === undefined ? '' : memo
  )
}
