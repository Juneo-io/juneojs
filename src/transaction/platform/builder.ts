import { type PlatformBlockchain } from '../../chain'
import { InputError } from '../../utils'
import { buildTransactionInputs, buildTransactionOutputs } from '../builder'
import { UserInput, type TransferableInput } from '../input'
import { type UserOutput, TransferableOutput, Secp256k1Output, type Utxo } from '../output'
import { TransactionFee } from '../transaction'
import { Address, AssetId, BlockchainId, DynamicId, NodeId, SupernetId } from '../types'
import { type SupernetAuth, type BLSSigner } from './supernet'
import {
  AddDelegatorTransaction,
  AddPermissionlessDelegatorTransaction,
  AddPermissionlessValidatorTransaction,
  AddSupernetValidatorTransaction,
  AddValidatorTransaction,
  CreateChainTransaction,
  CreateSupernetTransaction,
  PlatformBaseTransaction,
  PlatformExportTransaction,
  PlatformImportTransaction,
  RemoveSupernetValidatorTransaction,
  TransferSupernetOwnershipTransaction,
  TransformSupernetTransaction
} from './transaction'
import { Secp256k1OutputOwners, Validator } from './validation'

export function buildPlatformBaseTransaction (
  userInputs: UserInput[],
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): PlatformBaseTransaction {
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
  return new PlatformBaseTransaction(networkId, new BlockchainId(sourceId), outputs, inputs, memo)
}

export function buildPlatformExportTransaction (
  userInputs: UserInput[],
  utxoSet: Utxo[],
  sendersAddresses: string[],
  exportAddress: string,
  sourceFee: bigint,
  destinationFee: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): PlatformExportTransaction {
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

export function buildPlatformImportTransaction (
  userInputs: UserInput[],
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): PlatformImportTransaction {
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

/**
 * @deprecated
 * Use AddPermissionlessValidatorTransaction
 */
export function buildAddValidatorTransaction (
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  chain: PlatformBlockchain,
  nodeId: string | NodeId,
  startTime: bigint,
  endTime: bigint,
  stakeAmount: bigint,
  stakedAssetId: string,
  shares: number,
  stakeAddresses: string[],
  stakeThreshold: number,
  stakeTimelock: bigint,
  rewardAddresses: string[],
  rewardThreshold: number,
  rewardTimelock: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): AddValidatorTransaction {
  const userInput: UserInput = new UserInput(stakedAssetId, chain, stakeAmount, stakeAddresses, stakeThreshold, chain)
  const inputs: TransferableInput[] = buildTransactionInputs(
    [userInput],
    utxoSet,
    Address.toAddresses(sendersAddresses),
    [new TransactionFee(chain, fee)]
  )
  const outputs: UserOutput[] = buildTransactionOutputs(
    [userInput],
    inputs,
    new TransactionFee(chain, fee),
    changeAddress
  )
  const validator: Validator = new Validator(
    typeof nodeId === 'string' ? new NodeId(nodeId) : nodeId,
    startTime,
    endTime,
    stakeAmount
  )
  const stake: TransferableOutput[] = [
    new TransferableOutput(
      new AssetId(stakedAssetId),
      new Secp256k1Output(stakeAmount, stakeTimelock, stakeThreshold, Address.toAddresses(stakeAddresses))
    )
  ]
  const rewardsOwner: Secp256k1OutputOwners = new Secp256k1OutputOwners(
    rewardTimelock,
    rewardThreshold,
    Address.toAddresses(rewardAddresses)
  )
  const changeOutputs: TransferableOutput[] = []
  for (const output of outputs) {
    if (output.isChange) {
      changeOutputs.push(output)
    }
  }
  return new AddValidatorTransaction(
    networkId,
    new BlockchainId(chain.id),
    changeOutputs, // only using change outputs because of stake
    inputs,
    memo,
    validator,
    stake,
    rewardsOwner,
    shares
  )
}

/**
 * @deprecated
 * Use AddPermissionlessDelegatorTransaction
 */
export function buildAddDelegatorTransaction (
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  chain: PlatformBlockchain,
  nodeId: string | NodeId,
  startTime: bigint,
  endTime: bigint,
  stakeAmount: bigint,
  stakedAssetId: string,
  stakeAddresses: string[],
  stakeThreshold: number,
  stakeTimelock: bigint,
  rewardAddresses: string[],
  rewardThreshold: number,
  rewardTimelock: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): AddDelegatorTransaction {
  const userInput: UserInput = new UserInput(stakedAssetId, chain, stakeAmount, stakeAddresses, stakeThreshold, chain)
  const inputs: TransferableInput[] = buildTransactionInputs(
    [userInput],
    utxoSet,
    Address.toAddresses(sendersAddresses),
    [new TransactionFee(chain, fee)]
  )
  const outputs: UserOutput[] = buildTransactionOutputs(
    [userInput],
    inputs,
    new TransactionFee(chain, fee),
    changeAddress
  )
  const validator: Validator = new Validator(
    typeof nodeId === 'string' ? new NodeId(nodeId) : nodeId,
    startTime,
    endTime,
    stakeAmount
  )
  const stake: TransferableOutput[] = [
    new TransferableOutput(
      new AssetId(stakedAssetId),
      new Secp256k1Output(stakeAmount, stakeTimelock, stakeThreshold, Address.toAddresses(stakeAddresses))
    )
  ]
  const rewardsOwner: Secp256k1OutputOwners = new Secp256k1OutputOwners(
    rewardTimelock,
    rewardThreshold,
    Address.toAddresses(rewardAddresses)
  )
  const changeOutputs: TransferableOutput[] = []
  for (const output of outputs) {
    if (output.isChange) {
      changeOutputs.push(output)
    }
  }
  return new AddDelegatorTransaction(
    networkId,
    new BlockchainId(chain.id),
    changeOutputs, // only using change outputs because of stake
    inputs,
    memo,
    validator,
    stake,
    rewardsOwner
  )
}

export function buildAddSupernetValidatorTransaction (
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  chain: PlatformBlockchain,
  nodeId: string | NodeId,
  startTime: bigint,
  endTime: bigint,
  weight: bigint,
  supernetId: string | SupernetId,
  supernetAuth: SupernetAuth,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): AddSupernetValidatorTransaction {
  const signersAddresses: Address[] = Address.toAddresses(sendersAddresses)
  const inputs: TransferableInput[] = buildTransactionInputs([], utxoSet, signersAddresses, [
    new TransactionFee(chain, fee)
  ])
  const outputs: UserOutput[] = buildTransactionOutputs([], inputs, new TransactionFee(chain, fee), changeAddress)
  const validator: Validator = new Validator(
    typeof nodeId === 'string' ? new NodeId(nodeId) : nodeId,
    startTime,
    endTime,
    weight
  )
  return new AddSupernetValidatorTransaction(
    networkId,
    new BlockchainId(chain.id),
    outputs,
    inputs,
    memo,
    validator,
    typeof supernetId === 'string' ? new SupernetId(supernetId) : supernetId,
    supernetAuth
  )
}

export function buildCreateSupernetTransaction (
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  chain: PlatformBlockchain,
  supernetAuthAddresses: string[],
  supernetAuthThreshold: number,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): CreateSupernetTransaction {
  const inputs: TransferableInput[] = buildTransactionInputs([], utxoSet, Address.toAddresses(sendersAddresses), [
    new TransactionFee(chain, fee)
  ])
  const outputs: UserOutput[] = buildTransactionOutputs([], inputs, new TransactionFee(chain, fee), changeAddress)
  const rewardsOwner: Secp256k1OutputOwners = new Secp256k1OutputOwners(
    BigInt(0),
    supernetAuthThreshold,
    Address.toAddresses(supernetAuthAddresses)
  )
  return new CreateSupernetTransaction(networkId, new BlockchainId(chain.id), outputs, inputs, memo, rewardsOwner)
}

export function buildCreateChainTransaction (
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  chain: PlatformBlockchain,
  supernetId: string | SupernetId,
  name: string,
  chainAssetId: string | AssetId,
  vmId: string | DynamicId,
  fxIds: DynamicId[],
  genesisData: string,
  supernetAuth: SupernetAuth,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): CreateChainTransaction {
  const signersAddresses: Address[] = Address.toAddresses(sendersAddresses)
  const inputs: TransferableInput[] = buildTransactionInputs([], utxoSet, signersAddresses, [
    new TransactionFee(chain, fee)
  ])
  const outputs: UserOutput[] = buildTransactionOutputs([], inputs, new TransactionFee(chain, fee), changeAddress)
  return new CreateChainTransaction(
    networkId,
    new BlockchainId(chain.id),
    outputs,
    inputs,
    memo,
    typeof supernetId === 'string' ? new SupernetId(supernetId) : supernetId,
    name,
    typeof chainAssetId === 'string' ? new AssetId(chainAssetId) : chainAssetId,
    typeof vmId === 'string' ? new DynamicId(vmId) : vmId,
    fxIds,
    genesisData,
    supernetAuth
  )
}

export function buildRemoveSupernetValidatorTransaction (
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  chain: PlatformBlockchain,
  nodeId: string | NodeId,
  supernetId: string | SupernetId,
  supernetAuth: SupernetAuth,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): RemoveSupernetValidatorTransaction {
  const inputs: TransferableInput[] = buildTransactionInputs([], utxoSet, Address.toAddresses(sendersAddresses), [
    new TransactionFee(chain, fee)
  ])
  const outputs: UserOutput[] = buildTransactionOutputs([], inputs, new TransactionFee(chain, fee), changeAddress)
  return new RemoveSupernetValidatorTransaction(
    networkId,
    new BlockchainId(chain.id),
    outputs,
    inputs,
    memo,
    typeof nodeId === 'string' ? new NodeId(nodeId) : nodeId,
    typeof supernetId === 'string' ? new SupernetId(supernetId) : supernetId,
    supernetAuth
  )
}

export function buildTransferSupernetOwnershipTransaction (
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  chain: PlatformBlockchain,
  supernetId: string | SupernetId,
  supernetAuth: SupernetAuth,
  supernetAuthAddresses: string[],
  supernetAuthThreshold: number,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): TransferSupernetOwnershipTransaction {
  const inputs: TransferableInput[] = buildTransactionInputs([], utxoSet, Address.toAddresses(sendersAddresses), [
    new TransactionFee(chain, fee)
  ])
  const outputs: UserOutput[] = buildTransactionOutputs([], inputs, new TransactionFee(chain, fee), changeAddress)
  const owner: Secp256k1OutputOwners = new Secp256k1OutputOwners(
    BigInt(0),
    supernetAuthThreshold,
    Address.toAddresses(supernetAuthAddresses)
  )
  return new TransferSupernetOwnershipTransaction(
    networkId,
    new BlockchainId(chain.id),
    outputs,
    inputs,
    memo,
    typeof supernetId === 'string' ? new SupernetId(supernetId) : supernetId,
    supernetAuth,
    owner
  )
}

export function buildTransformSupernetTransaction (
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  chain: PlatformBlockchain,
  supernetId: SupernetId,
  assetId: AssetId,
  initialRewardPoolSupply: bigint,
  startRewardShare: bigint,
  startRewardTime: bigint,
  targetRewardShare: bigint,
  targetRewardTime: bigint,
  minValidatorStake: bigint,
  maxValidatorStake: bigint,
  minStakeDuration: number,
  maxStakeDuration: number,
  stakePeriodRewardShare: bigint,
  minDelegationFee: number,
  maxDelegationFee: number,
  minDelegatorStake: bigint,
  maxValidatorWeightFactor: number,
  uptimeRequirement: number,
  supernetAuth: SupernetAuth,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): TransformSupernetTransaction {
  // TODO when multisig update [changeAddress] and threshold
  const userInput: UserInput = new UserInput(assetId.assetId, chain, initialRewardPoolSupply, [changeAddress], 1, chain)
  const inputs: TransferableInput[] = buildTransactionInputs(
    [userInput],
    utxoSet,
    Address.toAddresses(sendersAddresses),
    [new TransactionFee(chain, fee)]
  )
  const outputs: UserOutput[] = buildTransactionOutputs(
    [userInput],
    inputs,
    new TransactionFee(chain, fee),
    changeAddress
  )
  const changeOutputs: TransferableOutput[] = []
  for (const output of outputs) {
    if (output.isChange) {
      changeOutputs.push(output)
    }
  }
  return new TransformSupernetTransaction(
    networkId,
    new BlockchainId(chain.id),
    changeOutputs,
    inputs,
    memo,
    supernetId,
    assetId,
    initialRewardPoolSupply,
    startRewardShare,
    startRewardTime,
    targetRewardShare,
    targetRewardTime,
    minValidatorStake,
    maxValidatorStake,
    minStakeDuration,
    maxStakeDuration,
    stakePeriodRewardShare,
    minDelegationFee,
    maxDelegationFee,
    minDelegatorStake,
    maxValidatorWeightFactor,
    uptimeRequirement,
    supernetAuth
  )
}

export function buildAddPermissionlessValidatorTransaction (
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  chain: PlatformBlockchain,
  nodeId: string | NodeId,
  startTime: bigint,
  endTime: bigint,
  supernetId: string | SupernetId,
  stakeAmount: bigint,
  stakedAssetId: string,
  shares: number,
  signer: BLSSigner,
  stakeAddresses: string[],
  stakeThreshold: number,
  stakeTimelock: bigint,
  rewardAddresses: string[],
  rewardThreshold: number,
  rewardTimelock: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): AddPermissionlessValidatorTransaction {
  const userInput: UserInput = new UserInput(stakedAssetId, chain, stakeAmount, stakeAddresses, stakeThreshold, chain)
  const inputs: TransferableInput[] = buildTransactionInputs(
    [userInput],
    utxoSet,
    Address.toAddresses(sendersAddresses),
    [new TransactionFee(chain, fee)]
  )
  const outputs: UserOutput[] = buildTransactionOutputs(
    [userInput],
    inputs,
    new TransactionFee(chain, fee),
    changeAddress
  )
  const validator: Validator = new Validator(
    typeof nodeId === 'string' ? new NodeId(nodeId) : nodeId,
    startTime,
    endTime,
    stakeAmount
  )
  const stake: TransferableOutput[] = [
    new TransferableOutput(
      new AssetId(stakedAssetId),
      new Secp256k1Output(stakeAmount, stakeTimelock, stakeThreshold, Address.toAddresses(stakeAddresses))
    )
  ]
  const rewardsOwner: Secp256k1OutputOwners = new Secp256k1OutputOwners(
    rewardTimelock,
    rewardThreshold,
    Address.toAddresses(rewardAddresses)
  )
  const changeOutputs: TransferableOutput[] = []
  for (const output of outputs) {
    if (output.isChange) {
      changeOutputs.push(output)
    }
  }
  return new AddPermissionlessValidatorTransaction(
    networkId,
    new BlockchainId(chain.id),
    changeOutputs, // only using change outputs because of stake
    inputs,
    memo,
    validator,
    typeof supernetId === 'string' ? new SupernetId(supernetId) : supernetId,
    signer,
    stake,
    rewardsOwner,
    rewardsOwner,
    shares
  )
}

export function buildAddPermissionlessDelegatorTransaction (
  utxoSet: Utxo[],
  sendersAddresses: string[],
  fee: bigint,
  chain: PlatformBlockchain,
  nodeId: string | NodeId,
  startTime: bigint,
  endTime: bigint,
  supernetId: string | SupernetId,
  stakeAmount: bigint,
  stakedAssetId: string,
  stakeAddresses: string[],
  stakeThreshold: number,
  stakeTimelock: bigint,
  rewardAddresses: string[],
  rewardThreshold: number,
  rewardTimelock: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): AddPermissionlessDelegatorTransaction {
  const userInput: UserInput = new UserInput(stakedAssetId, chain, stakeAmount, stakeAddresses, stakeThreshold, chain)
  const inputs: TransferableInput[] = buildTransactionInputs(
    [userInput],
    utxoSet,
    Address.toAddresses(sendersAddresses),
    [new TransactionFee(chain, fee)]
  )
  const outputs: UserOutput[] = buildTransactionOutputs(
    [userInput],
    inputs,
    new TransactionFee(chain, fee),
    changeAddress
  )
  const validator: Validator = new Validator(
    typeof nodeId === 'string' ? new NodeId(nodeId) : nodeId,
    startTime,
    endTime,
    stakeAmount
  )
  const stake: TransferableOutput[] = [
    new TransferableOutput(
      new AssetId(stakedAssetId),
      new Secp256k1Output(stakeAmount, stakeTimelock, stakeThreshold, Address.toAddresses(stakeAddresses))
    )
  ]
  const rewardsOwner: Secp256k1OutputOwners = new Secp256k1OutputOwners(
    rewardTimelock,
    rewardThreshold,
    Address.toAddresses(rewardAddresses)
  )
  const changeOutputs: TransferableOutput[] = []
  for (const output of outputs) {
    if (output.isChange) {
      changeOutputs.push(output)
    }
  }
  return new AddPermissionlessDelegatorTransaction(
    networkId,
    new BlockchainId(chain.id),
    changeOutputs, // only using change outputs because of stake
    inputs,
    memo,
    validator,
    typeof supernetId === 'string' ? new SupernetId(supernetId) : supernetId,
    stake,
    rewardsOwner
  )
}
