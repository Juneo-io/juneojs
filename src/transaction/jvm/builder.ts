import { buildTransactionInputs, buildTransactionOutputs } from '../builder'
import { UserInput, type TransferableInput } from '../input'
import { type Utxo } from '../utxo'
import { BaseTransaction, JVMExportTransaction, JVMImportTransaction } from './transaction'
import { Address, BlockchainId } from '../types'
import { type UserOutput, type TransferableOutput } from '../output'
import { InputError } from '../../utils'
import { TransactionFee } from '../transaction'

export function buildJVMBaseTransaction (
  userInputs: UserInput[],
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): BaseTransaction {
  if (userInputs.length < 1) {
    throw new InputError('user inputs cannot be empty')
  }
  const sourceId: string = userInputs[0].sourceChain.id
  userInputs.forEach((input) => {
    if (input.sourceChain.id !== sourceId || input.destinationChain.id !== sourceId) {
      throw new InputError('jvm base transaction cannot have different source/destination chain user inputs')
    }
  })
  const feeData = new TransactionFee(userInputs[0].sourceChain, fee)
  const inputs: TransferableInput[] = buildTransactionInputs(
    userInputs,
    utxoSet,
    Address.toAddresses(sendersAddresses),
    [feeData]
  )
  const outputs: UserOutput[] = buildTransactionOutputs(userInputs, inputs, feeData, changeAddress)
  return new BaseTransaction(networkId, new BlockchainId(sourceId), outputs, inputs, memo)
}

export function buildJVMExportTransaction (
  userInputs: UserInput[],
  utxoSet: Utxo[],
  sendersAddresses: string[],
  exportAddress: string,
  sourceFee: bigint,
  destinationFee: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): JVMExportTransaction {
  if (userInputs.length < 1) {
    throw new InputError('user inputs cannot be empty')
  }
  const sourceId: string = userInputs[0].sourceChain.id
  const destinationId: string = userInputs[0].destinationChain.id
  userInputs.forEach((input) => {
    if (input.sourceChain.id !== sourceId || input.destinationChain.id !== destinationId) {
      throw new InputError('jvm export transaction cannot have different source or destination chain user inputs')
    }
    if (input.sourceChain.id === input.destinationChain.id) {
      throw new InputError('jvm export transaction cannot have the same chain as source and destination user inputs')
    }
  })
  const sourceFeeData: TransactionFee = new TransactionFee(userInputs[0].sourceChain, sourceFee)
  const destinationFeeData: TransactionFee = new TransactionFee(userInputs[0].destinationChain, destinationFee)
  const fees: TransactionFee[] = [sourceFeeData, destinationFeeData]
  const inputs: TransferableInput[] = buildTransactionInputs(
    userInputs,
    utxoSet,
    Address.toAddresses(sendersAddresses),
    fees
  )
  // fixed user inputs with a defined export address to import it later
  const fixedUserInputs: UserInput[] = []
  userInputs.forEach((input) => {
    fixedUserInputs.push(
      new UserInput(input.assetId, input.sourceChain, input.amount, exportAddress, input.destinationChain)
    )
  })
  if (destinationFeeData.amount > BigInt(0)) {
    // adding fees as user input to be able to export it
    fixedUserInputs.push(
      new UserInput(
        destinationFeeData.assetId,
        userInputs[0].sourceChain,
        destinationFeeData.amount,
        exportAddress,
        userInputs[0].destinationChain
      )
    )
  }
  const outputs: UserOutput[] = buildTransactionOutputs(fixedUserInputs, inputs, sourceFeeData, changeAddress)
  const exportedOutputs: TransferableOutput[] = []
  const changeOutputs: TransferableOutput[] = []
  outputs.forEach((output) => {
    if (!output.isChange) {
      exportedOutputs.push(output)
    } else {
      changeOutputs.push(output)
    }
  })
  return new JVMExportTransaction(
    networkId,
    new BlockchainId(sourceId),
    changeOutputs,
    inputs,
    memo,
    new BlockchainId(destinationId),
    exportedOutputs
  )
}

export function buildJVMImportTransaction (
  userInputs: UserInput[],
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): JVMImportTransaction {
  if (userInputs.length < 1) {
    throw new InputError('user inputs cannot be empty')
  }
  const sourceId: string = userInputs[0].sourceChain.id
  const destinationId: string = userInputs[0].destinationChain.id
  userInputs.forEach((input) => {
    if (input.sourceChain.id !== sourceId || input.destinationChain.id !== destinationId) {
      throw new InputError('jvm import transaction cannot have different source or destination chain user inputs')
    }
    if (input.sourceChain.id === input.destinationChain.id) {
      throw new InputError('jvm import transaction cannot have the same chain as source and destination user inputs')
    }
  })
  const feeData: TransactionFee = new TransactionFee(userInputs[0].destinationChain, fee)
  const inputs: TransferableInput[] = []
  const importedInputs: TransferableInput[] = []
  buildTransactionInputs(userInputs, utxoSet, Address.toAddresses(sendersAddresses), [feeData]).forEach((input) => {
    if (input.input.utxo === undefined) {
      throw new InputError('input cannot use read only utxo')
    }
    const utxo: Utxo = input.input.utxo
    if (utxo.sourceChain === undefined) {
      inputs.push(input)
    } else {
      importedInputs.push(input)
    }
  })
  const outputs: UserOutput[] = buildTransactionOutputs(
    userInputs,
    inputs.concat(importedInputs),
    feeData,
    changeAddress
  )
  return new JVMImportTransaction(
    networkId,
    new BlockchainId(destinationId),
    outputs,
    inputs,
    memo,
    new BlockchainId(sourceId),
    importedInputs
  )
}
