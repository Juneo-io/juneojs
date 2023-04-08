import { InputError, OutputError } from '../utils'
import { Secp256k1Input, type Spendable, TransferableInput, type UserInput } from './input'
import { Secp256k1Output, Secp256k1OutputTypeId, UserOutput } from './output'
import { Utxo } from './utxo'
import * as time from '../utils/time'
import { Address, AssetId } from './types'
import { type GetUTXOsResponse } from '../api/data'
import { type FeeData } from './fee'

export function parseUtxoSet (data: GetUTXOsResponse): Utxo[] {
  const utxos: string[] = data.utxos
  const utxoSet: Utxo[] = []
  utxos.forEach(utxo => {
    utxoSet.push(Utxo.parse(utxo))
  })
  return utxoSet
}

export function buildTransactionInputs (userInputs: UserInput[], utxoSet: Utxo[],
  signersAddresses: Address[], fees: FeeData[]): TransferableInput[] {
  const targetAmounts: Record<string, bigint> = {}
  fees.forEach(fee => {
    if (fee.amount > 0) {
      targetAmounts[fee.assetId] = fee.amount
    }
  })
  // gathering data needed to build transaction inputs
  userInputs.forEach(input => {
    const assetId: string = input.assetId
    const targetAmount: bigint = targetAmounts[assetId]
    if (targetAmount === undefined) {
      targetAmounts[assetId] = input.amount
    } else {
      targetAmounts[assetId] += input.amount
    }
  })
  const gatheredAmounts: Record<string, bigint> = {}
  const inputs: TransferableInput[] = []
  // This loop tries to gather required amounts from the provided utxo set
  // it will try to get fees costs covered first and then
  // the amounts needed to send the required values in user inputs.
  // If it encounter the case of an utxo that is not useful to the
  // transaction it will still be added in the build outputs.
  // This is not an issue but note that it may require to group some utxos together
  // for the outputs so make sure to spend them to avoid losses.
  for (let i: number = 0;
    i < utxoSet.length && !isGatheringComplete(targetAmounts, gatheredAmounts);
    i++) {
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
    inputs.push(new TransferableInput(
      utxo.transactionId,
      utxo.utxoIndex,
      utxo.assetId,
      new Secp256k1Input(
        output.amount,
        getSignersIndices(signersAddresses, utxo.output.addresses),
        utxo
      )
    ))
    const assetId: string = utxo.assetId.assetId
    if (gatheredAmounts[assetId] === undefined) {
      gatheredAmounts[assetId] = BigInt(0)
    }
    gatheredAmounts[assetId] += output.amount
  }
  if (!isGatheringComplete(targetAmounts, gatheredAmounts)) {
    throw new InputError('provided utxo set does not have enough funds to cover user inputs')
  }
  return inputs
}

function isGatheringComplete (targets: Record<string, bigint>, gathereds: Record<string, bigint>): boolean {
  for (const key in targets) {
    const target: bigint = targets[key]
    const gathered: bigint = gathereds[key]
    if (gathered < target || gathered === undefined) {
      return false
    }
  }
  return true
}

function getSignersIndices (signers: Address[], addresses: Address[]): number[] {
  const indices: number[] = []
  for (let i: number = 0; i < signers.length; i++) {
    const signer: Address = signers[i]
    for (let j: number = 0; j < addresses.length; j++) {
      const address: Address = addresses[j]
      if (signer.matches(address)) {
        indices.push(j)
        break
      }
    }
  }
  return indices
}

export function buildTransactionOutputs (userInputs: UserInput[], inputs: Spendable[],
  fee: FeeData, changeAddress: string): UserOutput[] {
  const spentAmounts: Record<string, bigint> = {}
  // add fees as already spent so they are not added in outputs
  spentAmounts[fee.assetId] = fee.amount
  const outputs: UserOutput[] = []
  // adding outputs matching user inputs
  userInputs.forEach(input => {
    outputs.push(new UserOutput(
      new AssetId(input.assetId), new Secp256k1Output(
        input.amount,
        input.locktime,
        // for now threshold will only be 1
        1,
        // if we want to create a single output with multiple addresses
        // e.g. multisig we need to do changes here
        [new Address(input.address)]
      ),
      input
    ))
    const assetId: string = input.assetId
    const spentAmount: bigint = spentAmounts[assetId]
    if (spentAmount === undefined) {
      spentAmounts[assetId] = input.amount
    } else {
      spentAmounts[assetId] += input.amount
    }
  })
  const availableAmounts: Record<string, bigint> = {}
  // getting the total amount spendable for each asset in provided inputs
  inputs.forEach(input => {
    const availableAmount: bigint = availableAmounts[input.getAssetId().assetId]
    const amount: bigint = input.getAmount()
    if (availableAmount === undefined) {
      availableAmounts[input.getAssetId().assetId] = BigInt(amount)
    } else {
      availableAmounts[input.getAssetId().assetId] += BigInt(amount)
    }
  })
  // verifying that inputs have the funds to pay for the spent amounts
  // also adding extra outputs to avoid losses if we have unspent values
  for (let i: number = 0; i < inputs.length; i++) {
    const input: Spendable = inputs[i]
    const assetId: string = input.getAssetId().assetId
    const spent: bigint = spentAmounts[assetId] === undefined
      ? BigInt(0)
      : spentAmounts[assetId]
    const available: bigint = availableAmounts[assetId]
    if (spent > available) {
      throw new OutputError('output would produce more than provided inputs')
    }
    if (spent === available) {
      continue
    }
    // adding change output to send remaining value into the change address
    outputs.push(new UserOutput(
      input.getAssetId(), new Secp256k1Output(
        available - spent,
        // no locktime for the change
        BigInt(0),
        1,
        [new Address(changeAddress)]
      )
    ))
    // adding the spending of the change output
    if (spentAmounts[assetId] === undefined) {
      spentAmounts[assetId] = available - spent
    } else {
      spentAmounts[assetId] += available - spent
    }
  }
  return outputs
}
