import { type Blockchain } from '../../chain/chain'
import { InputError, TransactionError } from '../../utils'
import { buildTransactionInputs, buildTransactionOutputs } from '../builder'
import { FeeData } from '../fee'
import { UserInput, type TransferableInput } from '../input'
import { type UserOutput, TransferableOutput, Secp256k1Output } from '../output'
import { Address, AssetId, BlockchainId, NodeId, SupernetId } from '../types'
import { type Utxo } from '../utxo'
import { AddDelegatorTransaction, AddSupernetValidatorTransaction, AddValidatorTransaction, CreateSupernetTransaction, PlatformExportTransaction, PlatformImportTransaction } from './transaction'
import { SupernetAuth, Validator } from './validation'

export function buildPlatformExportTransaction (userInputs: UserInput[], utxoSet: Utxo[],
  sendersAddresses: string[], exportAddress: string, sourceFee: bigint, destinationFee: bigint, changeAddress: string,
  networkId: number, memo: string = ''): PlatformExportTransaction {
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
  const sourceFeeData: FeeData = new FeeData(userInputs[0].sourceChain, sourceFee)
  const destinationFeeData: FeeData = new FeeData(userInputs[0].destinationChain, destinationFee)
  const fees: FeeData[] = [sourceFeeData, destinationFeeData]
  const inputs: TransferableInput[] = buildTransactionInputs(userInputs, utxoSet, signersAddresses, fees)
  // fixed user inputs with a defined export address to import it later
  const fixedUserInputs: UserInput[] = []
  userInputs.forEach(input => {
    fixedUserInputs.push(new UserInput(input.assetId, input.sourceChain, input.amount,
      exportAddress, input.destinationChain)
    )
  })
  if (destinationFeeData.amount > BigInt(0)) {
    // adding fees as user input to be able to export it
    fixedUserInputs.push(new UserInput(destinationFeeData.assetId, userInputs[0].sourceChain,
      destinationFeeData.amount, exportAddress, userInputs[0].destinationChain)
    )
  }
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
  return new PlatformExportTransaction(
    networkId,
    new BlockchainId(sourceId),
    changeOutputs,
    inputs,
    memo,
    new BlockchainId(destinationId),
    exportedOutputs
  )
}

export function buildPlatformImportTransaction (userInputs: UserInput[], utxoSet: Utxo[], sendersAddresses: string[],
  fee: bigint, changeAddress: string, networkId: number, memo: string = ''): PlatformImportTransaction {
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
  const feeData: FeeData = new FeeData(userInputs[0].destinationChain, fee)
  const inputs: TransferableInput[] = []
  const importedInputs: TransferableInput[] = []
  buildTransactionInputs(userInputs, utxoSet, signersAddresses, [feeData]).forEach(input => {
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
  const outputs: UserOutput[] = buildTransactionOutputs(userInputs, inputs.concat(importedInputs), feeData, changeAddress)
  return new PlatformImportTransaction(
    networkId,
    new BlockchainId(destinationId),
    outputs,
    inputs,
    memo,
    new BlockchainId(sourceId),
    importedInputs
  )
}

export function buildAddValidatorTransaction (utxoSet: Utxo[], sendersAddresses: string[], fee: bigint, chain: Blockchain, nodeId: string | NodeId, startTime: bigint,
  endTime: bigint, stakeAmount: bigint, stakedAssetId: string, share: number, rewardAddress: string, changeAddress: string, networkId: number, memo: string = ''): AddValidatorTransaction {
  const signersAddresses: Address[] = []
  sendersAddresses.forEach(senderAddress => {
    signersAddresses.push(new Address(senderAddress))
  })
  const userInput: UserInput = new UserInput(stakedAssetId, chain, stakeAmount, rewardAddress, chain)
  const inputs: TransferableInput[] = buildTransactionInputs([userInput], utxoSet, signersAddresses, [new FeeData(chain, fee)])
  const outputs: UserOutput[] = buildTransactionOutputs([userInput], inputs, new FeeData(chain, fee), changeAddress)
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
  return new AddValidatorTransaction(
    networkId,
    new BlockchainId(chain.id),
    changeOutputs,
    inputs,
    memo,
    validator,
    stake,
    rewardsOwner,
    share
  )
}

export function buildAddDelegatorTransaction (utxoSet: Utxo[], sendersAddresses: string[], fee: bigint, chain: Blockchain, nodeId: string | NodeId, startTime: bigint,
  endTime: bigint, stakeAmount: bigint, stakedAssetId: string, rewardAddress: string, changeAddress: string, networkId: number, memo: string = ''): AddDelegatorTransaction {
  const signersAddresses: Address[] = []
  sendersAddresses.forEach(senderAddress => {
    signersAddresses.push(new Address(senderAddress))
  })
  const userInput: UserInput = new UserInput(stakedAssetId, chain, stakeAmount, rewardAddress, chain)
  const inputs: TransferableInput[] = buildTransactionInputs([userInput], utxoSet, signersAddresses, [new FeeData(chain, fee)])
  const outputs: UserOutput[] = buildTransactionOutputs([userInput], inputs, new FeeData(chain, fee), changeAddress)
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
    memo,
    validator,
    stake,
    rewardsOwner
  )
}

export function buildAddSupernetValidatorTransaction (utxoSet: Utxo[], sendersAddresses: string[], fee: bigint, chain: Blockchain, nodeId: string | NodeId, startTime: bigint,
  endTime: bigint, stakeAmount: bigint, supernetId: string | SupernetId, supernetAuthAddresses: string[], changeAddress: string, networkId: number, memo: string = ''): AddSupernetValidatorTransaction {
  const signersAddresses: Address[] = []
  sendersAddresses.forEach(senderAddress => {
    signersAddresses.push(new Address(senderAddress))
  })
  const inputs: TransferableInput[] = buildTransactionInputs([], utxoSet, signersAddresses, [new FeeData(chain, fee)])
  const outputs: UserOutput[] = buildTransactionOutputs([], inputs, new FeeData(chain, fee), changeAddress)
  const validator: Validator = new Validator(typeof nodeId === 'string' ? new NodeId(nodeId) : nodeId, startTime, endTime, stakeAmount)
  const supernetAuthIndices: number[] = []
  for (let i: number = 0; i < supernetAuthAddresses.length; i++) {
    const authAddress: Address = new Address(supernetAuthAddresses[i])
    let found: boolean = false
    for (let j: number = 0; j < signersAddresses.length; j++) {
      const signerAddress: Address = signersAddresses[j]
      if (authAddress.matches(signerAddress)) {
        supernetAuthIndices.push(j)
        found = true
        break
      }
    }
    if (!found) {
      throw new TransactionError(`missing signer address for auth address: ${supernetAuthAddresses[i]}`)
    }
  }
  return new AddSupernetValidatorTransaction(
    networkId,
    new BlockchainId(chain.id),
    outputs,
    inputs,
    memo,
    validator,
    typeof supernetId === 'string' ? new SupernetId(supernetId) : supernetId,
    new SupernetAuth(supernetAuthIndices)
  )
}

export function buildCreateSupernetTransaction (utxoSet: Utxo[], sendersAddresses: string[], fee: bigint, chain: Blockchain,
  supernetAuthAddresses: string[], supernetAuthThreshold: number, changeAddress: string, networkId: number, memo: string = ''): CreateSupernetTransaction {
  const signersAddresses: Address[] = []
  sendersAddresses.forEach(senderAddress => {
    signersAddresses.push(new Address(senderAddress))
  })
  const inputs: TransferableInput[] = buildTransactionInputs([], utxoSet, signersAddresses, [new FeeData(chain, fee)])
  const outputs: UserOutput[] = buildTransactionOutputs([], inputs, new FeeData(chain, fee), changeAddress)
  const authAddresses: Address[] = []
  supernetAuthAddresses.forEach(authAddress => {
    authAddresses.push(new Address(authAddress))
  })
  const rewardsOwner: Secp256k1Output = new Secp256k1Output(
    BigInt(0),
    BigInt(0),
    supernetAuthThreshold,
    authAddresses
  )
  return new CreateSupernetTransaction(
    networkId,
    new BlockchainId(chain.id),
    outputs,
    inputs,
    memo,
    rewardsOwner
  )
}
