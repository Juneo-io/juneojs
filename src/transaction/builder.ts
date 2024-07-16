import { InputError, OutputError, TimeUtils } from '../utils'
import { StakeableLockedInputTypeId, StakeableLockedOutputTypeId } from './constants'
import { Secp256k1Input, type Spendable, StakeableLockedInput, TransferableInput, type UserInput } from './input'
import {
  Secp256k1Output,
  StakeableLockedOutput,
  TransferableOutput,
  type TransferOutput,
  UserOutput,
  type Utxo
} from './output'
import { type TransactionFee } from './transaction'
import { Address, AssetId } from './types'

export function buildTransactionInputs (
  userInputs: UserInput[],
  utxoSet: Utxo[],
  signersAddresses: Address[],
  fees: TransactionFee[]
): TransferableInput[] {
  const targetAmounts = new Map<string, bigint>()
  for (const fee of fees) {
    if (fee.amount < 1) {
      continue
    }
    const assetId = fee.assetId
    const amount = targetAmounts.has(assetId) ? targetAmounts.get(assetId)! : BigInt(0)
    targetAmounts.set(assetId, amount + BigInt(fee.amount))
  }
  // gathering data needed to build transaction inputs
  for (const input of userInputs) {
    const assetId = input.assetId
    const amount = targetAmounts.has(assetId) ? targetAmounts.get(assetId)! : BigInt(0)
    targetAmounts.set(assetId, amount + BigInt(input.amount))
  }
  const gatheredAmounts = new Map<string, bigint>()
  // init all asset ids of targets to avoid undefined values
  for (const assetId of targetAmounts.keys()) {
    gatheredAmounts.set(assetId, BigInt(0))
  }
  const now = TimeUtils.now()
  const inputs: TransferableInput[] = []
  // This loop tries to gather required amounts from the provided utxo set
  // it will try to get fees costs covered first and then
  // the amounts needed to send the required values in user inputs.
  // If it encounter the case of an utxo that is not useful to the
  // transaction it will still be added in the build outputs.
  // This is not an issue but note that it may require to group some utxos together
  // for the outputs so make sure to spend them to avoid losses.
  for (let i = 0; i < utxoSet.length && !isGatheringComplete(targetAmounts, gatheredAmounts); i++) {
    const utxo = utxoSet[i]
    if (!('amount' in utxo.output)) {
      continue
    }
    const output = utxo.output as TransferOutput
    const locked = output.locktime > now
    const stakeable = output.typeId === StakeableLockedOutputTypeId
    // output cannot be consumed because it is timelocked
    if (locked && !stakeable) {
      throw new InputError('cannot consume time locked utxo')
    }
    const addressIndices = getSignersIndices(signersAddresses, utxo.output.addresses)
    const input =
      stakeable && locked
        ? new StakeableLockedInput(output.locktime, output.amount, addressIndices, utxo)
        : new Secp256k1Input(output.amount, addressIndices, utxo)
    // The utxo will be added as an input in any case
    inputs.push(new TransferableInput(utxo.transactionId, utxo.utxoIndex, utxo.assetId, input))
    const assetId = utxo.assetId.value
    gatheredAmounts.set(assetId, gatheredAmounts.get(assetId)! + BigInt(output.amount))
  }
  const missingFunds = !isGatheringComplete(targetAmounts, gatheredAmounts)
  if (!missingFunds) {
    return inputs
  }
  // first verify if funds are missing for tx + fee or for fee only
  // this is helpful for debugging or setting a correct max amount
  for (const fee of fees) {
    if (fee.amount < 1) {
      continue
    }
    const assetId = fee.assetId
    const amount = targetAmounts.has(assetId) ? targetAmounts.get(assetId)! : BigInt(0)
    targetAmounts.set(assetId, amount - BigInt(fee.amount))
  }
  // if gathering is successful here then it means only fee amount is missing
  if (isGatheringComplete(targetAmounts, gatheredAmounts)) {
    throw new InputError('provided utxo set does not have enough funds to cover fees')
  }
  // from here we are missing both fees amount but also amount for user inputs
  throw new InputError('provided utxo set does not have enough funds to cover user inputs')
}

function isGatheringComplete (targets: Map<string, bigint>, gathereds: Map<string, bigint>): boolean {
  for (const [key, target] of targets) {
    if (!gathereds.has(key) || gathereds.get(key)! < target) {
      return false
    }
  }
  return true
}

export function getSignersIndices (signers: Address[], addresses: Address[]): number[] {
  const indices: number[] = []
  for (const signer of Address.uniqueAddresses(signers)) {
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i]
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
  for (const input of userInputs) {
    const transferOutput = input.stakeable
      ? new StakeableLockedOutput(input.locktime, input.amount, input.threshold, Address.toAddresses(input.addresses))
      : new Secp256k1Output(input.amount, input.locktime, input.threshold, Address.toAddresses(input.addresses))
    outputs.push(new UserOutput(new AssetId(input.assetId), transferOutput, false))
    const assetId = input.assetId
    const amount = spentAmounts.has(assetId) ? spentAmounts.get(assetId)! : BigInt(0)
    spentAmounts.set(assetId, amount + BigInt(input.amount))
  }
  const availableAmounts = new Map<string, bigint>()
  // getting the total amount spendable for each asset in provided inputs
  for (const input of inputs) {
    const assetId = input.getAssetId().value
    const amount = availableAmounts.has(assetId) ? availableAmounts.get(assetId)! : BigInt(0)
    availableAmounts.set(assetId, amount + BigInt(input.getAmount()))
  }
  outputs = mergeSecp256k1Outputs(outputs)
  // verifying that inputs have the funds to pay for the spent amounts
  // also adding extra outputs to avoid losses if we have unspent values
  for (const input of inputs) {
    const assetId = input.getAssetId().value
    const spent = spentAmounts.has(assetId) ? spentAmounts.get(assetId)! : BigInt(0)
    const available = availableAmounts.has(assetId) ? availableAmounts.get(assetId)! : BigInt(0)
    if (spent > available) {
      throw new OutputError('output would produce more than provided inputs')
    }
    if (spent === available) {
      continue
    }
    const stakeable = input.getTypeId() === StakeableLockedInputTypeId
    const transferOutput = stakeable
      ? new StakeableLockedOutput((input as TransferableInput).input.utxo!.output.locktime, available - spent, 1, [
        new Address(changeAddress)
      ])
      : new Secp256k1Output(available - spent, BigInt(0), 1, [new Address(changeAddress)])
    // adding change output to send remaining value into the change address
    outputs.push(new UserOutput(input.getAssetId(), transferOutput, true))
    // adding the spending of the change output
    const amount = spentAmounts.has(assetId) ? spentAmounts.get(assetId)! : BigInt(0)
    spentAmounts.set(assetId, amount + available - spent)
  }
  return outputs
}

function mergeSecp256k1Outputs (outputs: UserOutput[]): UserOutput[] {
  const mergedOutputs: UserOutput[] = []
  const spendings = new Map<string, UserOutput>()
  for (const userOutput of outputs) {
    let key = userOutput.output.typeId.toString()
    key += userOutput.assetId.value
    key += userOutput.output.locktime
    key += userOutput.output.threshold
    for (const address of userOutput.output.addresses) {
      key += address.serialize().toHex()
    }
    if (spendings.has(key)) {
      const out = spendings.get(key)!.output
      out.amount += userOutput.output.amount
    } else {
      mergedOutputs.push(userOutput)
      spendings.set(key, userOutput)
    }
  }
  return mergedOutputs
}

export function buildStakeOutputs (stakeData: UserInput, inputs: TransferableInput[]): TransferableOutput[] {
  const stake: TransferableOutput[] = []
  const targetStake = stakeData.amount
  let spentStakeAmount = BigInt(0)
  let spentLockedStakeAmount = BigInt(0)
  const stakeableLockedInputs: StakeableLockedInput[] = []
  for (const transferableInput of inputs) {
    const input = transferableInput.input
    const remaining = targetStake - spentStakeAmount - spentLockedStakeAmount
    const spent = input.amount > remaining ? remaining : input.amount
    if (input.typeId === StakeableLockedInputTypeId) {
      spentLockedStakeAmount += spent
      stakeableLockedInputs.push(input as StakeableLockedInput)
    } else {
      spentStakeAmount += spent
    }
    // enough inputs will be used already
    if (spentStakeAmount + spentLockedStakeAmount >= targetStake) {
      break
    }
  }
  // output for regular stake
  if (spentStakeAmount > 0) {
    stake.push(
      new TransferableOutput(
        new AssetId(stakeData.assetId),
        new Secp256k1Output(
          spentStakeAmount,
          stakeData.locktime,
          stakeData.threshold,
          Address.toAddresses(stakeData.addresses)
        )
      )
    )
  }
  // output for stake that is stakeable only
  if (spentLockedStakeAmount > 0) {
    stake.push(...buildStakeStakeableLockedOutputs(stakeData, stakeableLockedInputs, spentLockedStakeAmount))
  }
  return stake
}

function buildStakeStakeableLockedOutputs (
  stakeData: UserInput,
  inputs: StakeableLockedInput[],
  spentLockedStakeAmount: bigint
): TransferableOutput[] {
  const outputs: TransferableOutput[] = []
  const locktimesMap = new Map<bigint, StakeableLockedInput[]>()
  for (const input of inputs) {
    const key = input.locktime
    if (!locktimesMap.has(key)) {
      locktimesMap.set(key, [])
    }
    const values = locktimesMap.get(key)
    values!.push(input)
  }
  let totalAmount = BigInt(0)
  for (const [locktime, inputs] of locktimesMap) {
    let outputAmount = BigInt(0)
    for (const input of inputs) {
      const remaining = spentLockedStakeAmount - totalAmount
      const isLast = input.amount > remaining
      const amount = isLast ? remaining : input.amount
      totalAmount += amount
      outputAmount += amount
      if (isLast) {
        break
      }
    }
    outputs.push(
      new TransferableOutput(
        new AssetId(stakeData.assetId),
        new StakeableLockedOutput(
          locktime,
          outputAmount,
          stakeData.threshold,
          Address.toAddresses(stakeData.addresses)
        )
      )
    )
    if (spentLockedStakeAmount - totalAmount < 1) {
      break
    }
  }
  return outputs
}
