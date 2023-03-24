import { type Blockchain } from '../chain'
import { InputError } from '../utils'
import { Secp256k1Input, TransferableInput, type UserInput } from './input'
import { type Secp256k1Output, Secp256k1OutputTypeId, type TransferableOutput } from './output'
import { type Utxo } from './utxo'
import * as time from '../utils/time'
import { type Address } from './types'

export function buildTransactionInputs (userInputs: UserInput[], utxoSet: Utxo[],
  signersAddresses: Address[], fees: bigint): TransferableInput[] {
  if (userInputs.length < 1) {
    throw new InputError('inputs cannot be empty')
  }
  const sourceChain: Blockchain = userInputs[0].sourceChain
  const targetAmounts: Record<string, bigint> = {}
  // checking user input validity and gathering data needed to build transaction inputs
  userInputs.forEach(input => {
    if (input.sourceChain.id !== sourceChain.id) {
      throw new InputError('all inputs do not have the same source chain')
    }
    // TODO check source/destination chain compatibility
    let targetAmount: bigint = targetAmounts[input.assetId.assetId]
    if (targetAmount === undefined) {
      targetAmount = input.amount
    } else {
      targetAmount += input.amount
    }
    targetAmounts[input.assetId.assetId] = targetAmount
  })
  const feesAssetId: string = sourceChain.assetId
  const gatheredAmounts: Record<string, bigint> = {}
  let feesGatheredAmount: bigint = BigInt(0)
  const inputs: TransferableInput[] = []
  // This loop tries to gather required amounts from the provided utxo set
  // it will try to get fees costs covered first and then
  // the amounts needed to send the required values in user inputs.
  // If it encounter the case of an utxo that is not useful to the
  // transaction it will still be added in the build outputs.
  // This is not an issue but note that it may require to group some utxos together
  // for the outputs so make sure to spend them to avoid losses.
  for (let i: number = 0;
    i < utxoSet.length && (feesGatheredAmount < fees || isGatheringComplete(targetAmounts, gatheredAmounts));
    i++) {
    const utxo: Utxo = utxoSet[i]
    const typeId: number = utxo.output.typeId
    if (typeId !== Secp256k1OutputTypeId) {
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
        utxo,
        output.amount,
        getSignersIndices(signersAddresses, utxo.output.addresses)
      )
    ))
    let availableAmount: bigint = output.amount
    const assetId: string = utxo.assetId.assetId
    // fees gathering
    if (feesGatheredAmount < fees && assetId === feesAssetId) {
      const neededAmount: bigint = fees - feesGatheredAmount
      const amount: bigint = availableAmount > neededAmount
        ? availableAmount - neededAmount
        : availableAmount
      availableAmount -= amount
      feesGatheredAmount += amount
    }
    // remaining value gathering
    gatheredAmounts[assetId] += availableAmount
  }
  return inputs
}

function isGatheringComplete (targets: Record<string, bigint>, gathereds: Record<string, bigint>): boolean {
  for (const key in targets) {
    const target: bigint = targets[key]
    const gathered: bigint = gathereds[key]
    if (gathered < target) {
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

export function buildTransactionOutputs (): TransferableOutput[] {
  throw new Error('not implemented')
}
