import { InputError, OutputError } from '../utils'
import { Secp256k1Input, type Spendable, TransferableInput, type UserInput } from './input'
import { Secp256k1Output, Secp256k1OutputTypeId, type TransactionOutput, UserOutput, type Utxo } from './output'
import * as time from '../utils/time'
import { Address, AssetId } from './types'
import { type TransactionFee } from './transaction'

export function buildTransactionInputs (
  userInputs: UserInput[],
  utxoSet: Utxo[],
  signersAddresses: Address[],
  fees: TransactionFee[]
): TransferableInput[] {
  const targetAmounts = new Map<string, bigint>()
  fees.forEach((fee) => {
    if (fee.amount > 0) {
      const assetId: string = fee.assetId
      let targetAmount: bigint = BigInt(fee.amount)
      if (targetAmounts.has(assetId)) {
        targetAmount += targetAmounts.get(assetId)!
      }
      targetAmounts.set(assetId, targetAmount)
    }
  })
  // gathering data needed to build transaction inputs
  userInputs.forEach((input) => {
    const assetId: string = input.assetId
    let targetAmount: bigint = BigInt(input.amount)
    if (targetAmounts.has(assetId)) {
      targetAmount += targetAmounts.get(assetId)!
    }
    targetAmounts.set(assetId, targetAmount)
  })
  const gatheredAmounts = new Map<string, bigint>()
  const inputs: TransferableInput[] = []
  // This loop tries to gather required amounts from the provided utxo set
  // it will try to get fees costs covered first and then
  // the amounts needed to send the required values in user inputs.
  // If it encounter the case of an utxo that is not useful to the
  // transaction it will still be added in the build outputs.
  // This is not an issue but note that it may require to group some utxos together
  // for the outputs so make sure to spend them to avoid losses.
  for (let i: number = 0; i < utxoSet.length && !isGatheringComplete(targetAmounts, gatheredAmounts); i++) {
    const utxo: Utxo = utxoSet[i]
    if (utxo.output.typeId !== Secp256k1OutputTypeId) {
      continue
    }
    const output: Secp256k1Output = utxo.output as Secp256k1Output
    // output cannot be consumed because it is timelocked
    if (output.locktime > time.now()) {
      continue
    }
    // The utxo will be added as an input in any case
    inputs.push(
      new TransferableInput(
        utxo.transactionId,
        utxo.utxoIndex,
        utxo.assetId,
        new Secp256k1Input(output.amount, getSignersIndices(signersAddresses, utxo.output.addresses), utxo)
      )
    )
    const assetId: string = utxo.assetId.assetId
    let gathered: bigint = BigInt(output.amount)
    if (gatheredAmounts.has(assetId)) {
      gathered += gatheredAmounts.get(assetId)!
    }
    gatheredAmounts.set(assetId, gathered)
  }
  if (!isGatheringComplete(targetAmounts, gatheredAmounts)) {
    throw new InputError('provided utxo set does not have enough funds to cover user inputs')
  }
  return inputs
}

function isGatheringComplete (targets: Map<string, bigint>, gathereds: Map<string, bigint>): boolean {
  let complete: boolean = true
  targets.forEach((target, key) => {
    if (!gathereds.has(key) || gathereds.get(key)! < target) {
      complete = false
      return false
    }
  })
  return complete
}

export function getSignersIndices (signers: Address[], addresses: Address[]): number[] {
  const indices: number[] = []
  for (const signer of signers) {
    for (let i: number = 0; i < addresses.length; i++) {
      const address: Address = addresses[i]
      if (signer.matches(address)) {
        indices.push(i)
        break
      }
    }
  }
  return indices
}

export function buildTransactionOutputs (
  userInputs: UserInput[],
  inputs: Spendable[],
  fee: TransactionFee,
  changeAddress: string
): UserOutput[] {
  const spentAmounts = new Map<string, bigint>()
  // add fees as already spent so they are not added in outputs
  spentAmounts.set(fee.assetId, fee.amount)
  let outputs: UserOutput[] = []
  // adding outputs matching user inputs
  userInputs.forEach((input) => {
    outputs.push(
      new UserOutput(
        new AssetId(input.assetId),
        new Secp256k1Output(input.amount, input.locktime, input.threshold, Address.toAddresses(input.addresses)),
        false
      )
    )
    const assetId: string = input.assetId
    let spentAmount: bigint = BigInt(input.amount)
    if (spentAmounts.has(assetId)) {
      spentAmount += spentAmounts.get(assetId)!
    }
    spentAmounts.set(assetId, spentAmount)
  })
  const availableAmounts = new Map<string, bigint>()
  // getting the total amount spendable for each asset in provided inputs
  inputs.forEach((input) => {
    const assetId: string = input.getAssetId().assetId
    let amount: bigint = BigInt(input.getAmount())
    if (availableAmounts.has(assetId)) {
      amount += availableAmounts.get(assetId)!
    }
    availableAmounts.set(assetId, amount)
  })
  outputs = mergeSecp256k1Outputs(outputs)
  // verifying that inputs have the funds to pay for the spent amounts
  // also adding extra outputs to avoid losses if we have unspent values
  for (const input of inputs) {
    const assetId: string = input.getAssetId().assetId
    const spent: bigint = spentAmounts.has(assetId) ? spentAmounts.get(assetId)! : BigInt(0)
    const available: bigint = availableAmounts.has(assetId) ? availableAmounts.get(assetId)! : BigInt(0)
    if (spent > available) {
      throw new OutputError('output would produce more than provided inputs')
    }
    if (spent === available) {
      continue
    }
    // adding change output to send remaining value into the change address
    outputs.push(
      new UserOutput(
        input.getAssetId(),
        new Secp256k1Output(
          available - spent,
          // no locktime for the change
          BigInt(0),
          1,
          [new Address(changeAddress)]
        ),
        true
      )
    )
    // adding the spending of the change output
    let amount: bigint = available - spent
    if (spentAmounts.has(assetId)) {
      amount += spentAmounts.get(assetId)!
    }
    spentAmounts.set(assetId, amount)
  }
  return outputs
}

function mergeSecp256k1Outputs (outputs: UserOutput[]): UserOutput[] {
  const mergedOutputs: UserOutput[] = []
  const spendings = new Map<string, UserOutput>()
  outputs.forEach((output) => {
    let key: string = output.assetId.assetId
    key += output.output.locktime
    key += output.output.threshold.toString()
    output.output.addresses.sort(Address.comparator)
    output.output.addresses.forEach((address) => {
      key += address.serialize().toHex()
    })
    if (spendings.has(key)) {
      const out: TransactionOutput = spendings.get(key)!.output
      ;(out as Secp256k1Output).amount += (output.output as Secp256k1Output).amount
    } else {
      mergedOutputs.push(output)
      spendings.set(key, output)
    }
  })
  return mergedOutputs
}
