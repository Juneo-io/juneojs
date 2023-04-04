import { type Blockchain } from '../../chain/chain'
import { InputError } from '../../utils'
import { buildTransactionInputs, buildTransactionOutputs } from '../builder'
import { FeeData } from '../fee'
import { UserInput, type TransferableInput } from '../input'
import { type UserOutput, TransferableOutput, Secp256k1Output } from '../output'
import { Address, AssetId, BlockchainId, NodeId } from '../types'
import { type Utxo } from '../utxo'
import { AddDelegatorTransaction, RelayExportTransaction, RelayImportTransaction } from './transaction'
import { Validator } from './validation'

export function buildRelayExportTransaction (userInputs: UserInput[], utxoSet: Utxo[],
  sendersAddresses: string[], exportAddress: string, sourceFee: bigint, destinationFee: bigint, changeAddress: string,
  networkId: number, memo?: string): RelayExportTransaction {
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
  const sourceFeeData: FeeData = new FeeData(userInputs[0].sourceChain.assetId, sourceFee)
  const destinationFeeData: FeeData = new FeeData(userInputs[0].destinationChain.assetId, destinationFee)
  const fees: FeeData[] = [sourceFeeData, destinationFeeData]
  const inputs: TransferableInput[] = buildTransactionInputs(userInputs, utxoSet, signersAddresses, fees)
  // fixed user inputs with a defined export address to import it later
  const fixedUserInputs: UserInput[] = []
  userInputs.forEach(input => {
    fixedUserInputs.push(new UserInput(input.assetId, input.sourceChain, input.amount,
      exportAddress, input.destinationChain)
    )
  })
  // adding fees as user input to be able to export it
  fixedUserInputs.push(new UserInput(destinationFeeData.assetId, userInputs[0].sourceChain,
    destinationFeeData.amount, exportAddress, userInputs[0].destinationChain)
  )
  const outputs: UserOutput[] = buildTransactionOutputs(fixedUserInputs, inputs, sourceFeeData, changeAddress)
  const exportedOutputs: TransferableOutput[] = []
  const changeOutputs: TransferableOutput[] = []
  outputs.forEach(output => {
    // no user input means change output
    if (output.input !== undefined) {
      exportedOutputs.push(output)
    } else {
      changeOutputs.push(output)
    }
  })
  return new RelayExportTransaction(
    networkId,
    new BlockchainId(sourceId),
    changeOutputs,
    inputs,
    memo === undefined ? '' : memo,
    new BlockchainId(destinationId),
    exportedOutputs
  )
}

export function buildRelayImportTransaction (userInputs: UserInput[], utxoSet: Utxo[], sendersAddresses: string[],
  fee: bigint, changeAddress: string, networkId: number, memo?: string): RelayImportTransaction {
  if (userInputs.length < 1) {
    throw new InputError('user inputs cannot be empty')
  }
  const sourceId: string = userInputs[0].sourceChain.id
  const destinationId: string = userInputs[0].destinationChain.id
  userInputs.forEach(input => {
    if (input.sourceChain.id !== sourceId || input.destinationChain.id !== destinationId) {
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
  const feeData: FeeData = new FeeData(userInputs[0].destinationChain.assetId, fee)
  const importedInputs: TransferableInput[] = buildTransactionInputs(userInputs, utxoSet, signersAddresses, [feeData])
  const outputs: UserOutput[] = buildTransactionOutputs(userInputs, importedInputs, feeData, changeAddress)
  return new RelayImportTransaction(
    networkId,
    new BlockchainId(destinationId),
    outputs,
    [],
    memo === undefined ? '' : memo,
    new BlockchainId(sourceId),
    importedInputs
  )
}

export function buildAddDelegatorTransaction (utxoSet: Utxo[], sendersAddresses: string[], fee: bigint, chain: Blockchain, nodeId: string | NodeId, startTime: bigint,
  endTime: bigint, stakeAmount: bigint, stakedAssetId: string, rewardAddress: string, changeAddress: string, networkId: number, memo?: string): AddDelegatorTransaction {
  const signersAddresses: Address[] = []
  sendersAddresses.forEach(senderAddress => {
    signersAddresses.push(new Address(senderAddress))
  })
  const userInput: UserInput = new UserInput(stakedAssetId, chain, stakeAmount, rewardAddress, chain)
  const inputs: TransferableInput[] = buildTransactionInputs([userInput], utxoSet, signersAddresses, [new FeeData(chain.assetId, fee)])
  const outputs: UserOutput[] = buildTransactionOutputs([userInput], inputs, new FeeData(chain.assetId, fee), changeAddress)
  const validator: Validator = new Validator(typeof nodeId === 'string' ? new NodeId(nodeId) : nodeId, startTime, endTime, stakeAmount)
  const stake: TransferableOutput[] = [
    new TransferableOutput(
      new AssetId(stakedAssetId),
      new Secp256k1Output(
        stakeAmount,
        BigInt(0),
        1,
        [new Address(rewardAddress)]
      )
    )
  ]
  const rewardsOwner: Secp256k1Output = new Secp256k1Output(
    stakeAmount,
    BigInt(0),
    1,
    [new Address(rewardAddress)]
  )
  const changeOutputs: TransferableOutput[] = []
  outputs.forEach(output => {
    // no user input means change output
    if (output.input === undefined) {
      changeOutputs.push(output)
    }
  })
  return new AddDelegatorTransaction(
    networkId,
    new BlockchainId(chain.id),
    changeOutputs,
    inputs,
    memo === undefined ? '' : memo,
    validator,
    stake,
    rewardsOwner
  )
}
