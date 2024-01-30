import { InputError, OutputError } from '../../utils'
import { buildTransactionInputs, buildTransactionOutputs } from '../builder'
import { type TransferableInput, UserInput } from '../input'
import { type UserOutput } from '../output'
import { TransactionFee } from '../transaction'
import { Address, AssetId, BlockchainId } from '../types'
import { type Utxo } from '../utxo'
import { EVMInput, EVMOutput, JEVMExportTransaction, JEVMImportTransaction } from './transaction'

export function buildTransactionEVMInputs (
  userInputs: UserInput[],
  signer: string,
  nonce: bigint,
  fees: TransactionFee[]
): EVMInput[] {
  const inputs: EVMInput[] = []
  const values = new Map<string, bigint>()
  // merging inputs
  userInputs.forEach((userInput) => {
    const assetId: string = userInput.assetId
    let value: bigint = userInput.amount
    if (values.has(assetId)) {
      value += values.get(assetId) as bigint
    }
    values.set(assetId, value)
  })
  // adding and merging fees
  fees.forEach((fee) => {
    if (fee.amount > 0) {
      const assetId: string = fee.assetId
      let value: bigint = fee.amount
      if (values.has(assetId)) {
        value += values.get(assetId) as bigint
      }
      values.set(assetId, value)
    }
  })
  // adding inputs
  for (const [key, value] of values) {
    inputs.push(new EVMInput(new Address(signer), value, new AssetId(key), nonce))
  }
  return inputs
}

export function buildTransactionEVMOutputs (
  userInputs: UserInput[],
  inputs: TransferableInput[],
  feeData: TransactionFee
): EVMOutput[] {
  const spentAmounts = new Map<string, bigint>()
  // add fees as already spent so they are not added in outputs
  spentAmounts.set(feeData.assetId, feeData.amount)
  // adding outputs matching user inputs
  const outputs: EVMOutput[] = []
  userInputs.forEach((input) => {
    const assetId: string = input.assetId
    if (input.addresses.length !== 1) {
      throw new InputError('user input must have a unique address for EVM output')
    }
    outputs.push(new EVMOutput(new Address(input.addresses[0]), input.amount, new AssetId(assetId)))
    let spentAmount: bigint = input.amount
    if (spentAmounts.has(assetId)) {
      spentAmount += spentAmounts.get(assetId) as bigint
    }
    spentAmounts.set(assetId, spentAmount)
  })
  const availableAmounts: Record<string, bigint> = {}
  // getting the total amount spendable for each asset in provided inputs
  inputs.forEach((input) => {
    const availableAmount: bigint = availableAmounts[input.getAssetId().assetId]
    const amount: bigint = input.getAmount()
    if (availableAmount === undefined) {
      availableAmounts[input.getAssetId().assetId] = BigInt(amount)
    } else {
      availableAmounts[input.getAssetId().assetId] += BigInt(amount)
    }
  })
  // verifying that inputs have the funds to pay for the spent amounts
  for (const input of inputs) {
    const assetId: string = input.getAssetId().assetId
    const spent: bigint = spentAmounts.has(assetId) ? (spentAmounts.get(assetId) as bigint) : BigInt(0)
    const available: bigint = availableAmounts[assetId]
    if (spent > available) {
      throw new OutputError('output would produce more than provided inputs')
    }
  }
  return outputs
}

export function buildJEVMExportTransaction (
  userInputs: UserInput[],
  signer: string,
  nonce: bigint,
  exportAddress: string,
  sourceFee: bigint,
  destinationFee: bigint,
  networkId: number
): JEVMExportTransaction {
  if (userInputs.length < 1) {
    throw new InputError('user inputs cannot be empty')
  }
  const sourceId: string = userInputs[0].sourceChain.id
  const destinationId: string = userInputs[0].destinationChain.id
  userInputs.forEach((input) => {
    if (input.sourceChain.id !== sourceId || input.destinationChain.id !== destinationId) {
      throw new InputError('jevm export transaction cannot have different source or destination chain user inputs')
    }
    if (input.sourceChain.id === input.destinationChain.id) {
      throw new InputError('jevm export transaction cannot have the same chain as source and destination user inputs')
    }
  })
  const sourceFeeData: TransactionFee = new TransactionFee(userInputs[0].sourceChain, sourceFee)
  const destinationFeeData: TransactionFee = new TransactionFee(userInputs[0].destinationChain, destinationFee)
  const fees: TransactionFee[] = [sourceFeeData, destinationFeeData]
  const inputs: EVMInput[] = buildTransactionEVMInputs(userInputs, signer, nonce, fees)
  // fixed user inputs with a defined export address to import it later
  const fixedUserInputs: UserInput[] = []
  userInputs.forEach((input) => {
    fixedUserInputs.push(
      new UserInput(input.assetId, input.sourceChain, input.amount, [exportAddress], 1, input.destinationChain)
    )
  })
  if (destinationFeeData.amount > BigInt(0)) {
    // adding fees as user input to be able to export it
    fixedUserInputs.push(
      new UserInput(
        destinationFeeData.assetId,
        userInputs[0].sourceChain,
        destinationFeeData.amount,
        [exportAddress],
        1,
        userInputs[0].destinationChain
      )
    )
  }
  // we provide a change address but this will not be used here because
  // inputs will have fixed value as they are EVM Inputs
  const exportedOutputs: UserOutput[] = buildTransactionOutputs(fixedUserInputs, inputs, sourceFeeData, signer)
  return new JEVMExportTransaction(
    networkId,
    new BlockchainId(sourceId),
    new BlockchainId(destinationId),
    inputs,
    exportedOutputs
  )
}

export function buildJEVMImportTransaction (
  userInputs: UserInput[],
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  networkId: number
): JEVMImportTransaction {
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
  const importedInputs: TransferableInput[] = buildTransactionInputs(
    userInputs,
    utxoSet,
    Address.toAddresses(sendersAddresses),
    [feeData]
  )
  const outputs: EVMOutput[] = buildTransactionEVMOutputs(userInputs, importedInputs, feeData)
  return new JEVMImportTransaction(
    networkId,
    new BlockchainId(destinationId),
    new BlockchainId(sourceId),
    importedInputs,
    outputs
  )
}
