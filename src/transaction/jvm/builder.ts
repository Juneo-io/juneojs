import { buildTransactionInputs, buildTransactionOutputs } from '../builder'
import { type TransferableInput, type UserInput } from '../input'
import { type Utxo } from '../utxo'
import { BaseTransaction, JVMExportTransaction, JVMImportTransaction } from './transaction'
import { Address, BlockchainId } from '../types'
import { type TransferableOutput } from '../output'
import { InputError } from '../../utils/errors'

export function buildJVMBaseTransaction (userInputs: UserInput[], utxoSet: Utxo[],
  sendersAddresses: string[], fees: bigint, changeAddress: string,
  networkId: number, memo?: string): BaseTransaction {
  if (userInputs.length < 1) {
    throw new InputError('user inputs cannot be empty')
  }
  const sourceId: string = userInputs[0].sourceChain.id
  userInputs.forEach(input => {
    if (input.sourceChain.id !== sourceId || input.destinationChain.id !== sourceId) {
      throw new InputError('jvm base transaction cannot have different source/destination chain user inputs')
    }
  })
  const signersAddresses: Address[] = []
  sendersAddresses.forEach(senderAddress => {
    signersAddresses.push(new Address(senderAddress))
  })
  const inputs: TransferableInput[] = buildTransactionInputs(userInputs, utxoSet, signersAddresses, fees)
  const outputs: TransferableOutput[] = buildTransactionOutputs(userInputs, inputs, fees, changeAddress)
  return new BaseTransaction(
    networkId,
    new BlockchainId(sourceId),
    outputs,
    inputs,
    memo === undefined ? '' : memo
  )
}

export function buildJVMExportTransaction (userInputs: UserInput[], utxoSet: Utxo[],
  sendersAddresses: string[], fees: bigint, changeAddress: string,
  networkId: number, memo?: string): JVMExportTransaction {
  if (userInputs.length < 1) {
    throw new InputError('user inputs cannot be empty')
  }
  const sourceId: string = userInputs[0].sourceChain.id
  const destinationId: string = userInputs[0].destinationChain.id
  userInputs.forEach(input => {
    if (input.sourceChain.id !== sourceId || input.destinationChain.id !== destinationId) {
      throw new InputError('jvm export transaction cannot have different source or destination chain user inputs')
    }
    if (input.sourceChain.id === input.destinationChain.id) {
      throw new InputError('jvm export transaction cannot have the same chain as source and destination user inputs')
    }
  })
  const signersAddresses: Address[] = []
  sendersAddresses.forEach(senderAddress => {
    signersAddresses.push(new Address(senderAddress))
  })
  const inputs: TransferableInput[] = buildTransactionInputs(userInputs, utxoSet, signersAddresses, fees)
  const exportedOutputs: TransferableOutput[] = buildTransactionOutputs(userInputs, inputs, fees, changeAddress)
  return new JVMExportTransaction(
    networkId,
    new BlockchainId(sourceId),
    [],
    inputs,
    memo === undefined ? '' : memo,
    new BlockchainId(destinationId),
    exportedOutputs
  )
}

export function buildJVMImportTransaction (userInputs: UserInput[], utxoSet: Utxo[], sendersAddresses: string[],
  fees: bigint, changeAddress: string, networkId: number, memo?: string): JVMImportTransaction {
  if (userInputs.length < 1) {
    throw new InputError('user inputs cannot be empty')
  }
  const sourceId: string = userInputs[0].sourceChain.id
  const chainId: string = userInputs[0].destinationChain.id
  userInputs.forEach(input => {
    if (input.sourceChain.id !== sourceId || input.destinationChain.id !== chainId) {
      throw new InputError('jvm import transaction cannot have different source or destination chain user inputs')
    }
    if (input.sourceChain.id === input.destinationChain.id) {
      throw new InputError('jvm import transaction cannot have the same chain as source and destination user inputs')
    }
  })
  const signersAddresses: Address[] = []
  sendersAddresses.forEach(senderAddress => {
    signersAddresses.push(new Address(senderAddress))
  })
  const importedInputs: TransferableInput[] = buildTransactionInputs(userInputs, utxoSet, signersAddresses, fees)
  const outputs: TransferableOutput[] = buildTransactionOutputs(userInputs, importedInputs, fees, changeAddress)
  return new JVMImportTransaction(
    networkId,
    new BlockchainId(chainId),
    outputs,
    [],
    memo === undefined ? '' : memo,
    new BlockchainId(sourceId),
    importedInputs
  )
}
