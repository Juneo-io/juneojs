import { type PlatformBlockchain } from '../../chain'
import { InputError } from '../../utils'
import { buildStakeOutputs, buildTransactionInputs, buildTransactionOutputs } from '../builder'
import { UserInput, type TransferableInput } from '../input'
import { Secp256k1OutputOwners, type TransferableOutput, type UserOutput, type Utxo } from '../output'
import { TransactionFee } from '../transaction'
import { Address, AssetId, BlockchainId, DynamicId, NodeId, SupernetId } from '../types'
import { Validator, type BLSSigner, type SupernetAuth } from './supernet'
import {
  AddPermissionlessDelegatorTransaction,
  AddPermissionlessValidatorTransaction,
  AddSupernetValidatorTransaction,
  CreateChainTransaction,
  CreateSupernetTransaction,
  PlatformBaseTransaction,
  PlatformExportTransaction,
  PlatformImportTransaction,
  RemoveSupernetValidatorTransaction,
  TransferSupernetOwnershipTransaction,
  TransformSupernetTransaction
} from './transaction'

export function buildPlatformBaseTransaction (
  userInputs: UserInput[],
  utxoSet: Utxo[],
  signersAddresses: Address[],
  fee: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): PlatformBaseTransaction {
  if (userInputs.length < 1) {
    throw new InputError('user inputs cannot be empty')
  }
  const sourceId: string = userInputs[0].sourceChain.id
  for (const input of userInputs) {
    if (input.sourceChain.id !== sourceId || input.destinationChain.id !== sourceId) {
      throw new InputError('jvm base transaction cannot have different source/destination chain user inputs')
    }
  }
  const feeData = new TransactionFee(userInputs[0].sourceChain, fee)
  const inputs: TransferableInput[] = buildTransactionInputs(userInputs, utxoSet, signersAddresses, [feeData])
  const outputs: UserOutput[] = buildTransactionOutputs(userInputs, inputs, feeData, changeAddress)
  return new PlatformBaseTransaction(networkId, new BlockchainId(sourceId), outputs, inputs, memo)
}

export function buildPlatformExportTransaction (
  userInputs: UserInput[],
  utxoSet: Utxo[],
  signersAddresses: Address[],
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
  for (const input of userInputs) {
    if (input.sourceChain.id !== sourceId || input.destinationChain.id !== destinationId) {
      throw new InputError('jvm export transaction cannot have different source or destination chain user inputs')
    }
    if (input.sourceChain.id === input.destinationChain.id) {
      throw new InputError('jvm export transaction cannot have the same chain as source and destination user inputs')
    }
  }
  const sourceFeeData: TransactionFee = new TransactionFee(userInputs[0].sourceChain, sourceFee)
  const destinationFeeData: TransactionFee = new TransactionFee(userInputs[0].destinationChain, destinationFee)
  const fees: TransactionFee[] = [sourceFeeData, destinationFeeData]
  const inputs: TransferableInput[] = buildTransactionInputs(userInputs, utxoSet, signersAddresses, fees)
  // fixed user inputs with a defined export address to import it later
  const fixedUserInputs: UserInput[] = []
  for (const input of userInputs) {
    fixedUserInputs.push(
      new UserInput(input.assetId, input.sourceChain, input.amount, [exportAddress], 1, input.destinationChain)
    )
  }
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
  for (const output of outputs) {
    if (!output.isChange) {
      exportedOutputs.push(output)
    } else {
      changeOutputs.push(output)
    }
  }
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
  signersAddresses: Address[],
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
  for (const input of userInputs) {
    if (input.sourceChain.id !== sourceId || input.destinationChain.id !== destinationId) {
      throw new InputError('jvm import transaction cannot have different source or destination chain user inputs')
    }
    if (input.sourceChain.id === input.destinationChain.id) {
      throw new InputError('jvm import transaction cannot have the same chain as source and destination user inputs')
    }
  }
  const feeData: TransactionFee = new TransactionFee(userInputs[0].destinationChain, fee)
  const inputs: TransferableInput[] = []
  const importedInputs: TransferableInput[] = []
  for (const input of buildTransactionInputs(userInputs, utxoSet, signersAddresses, [feeData])) {
    if (input.input.utxo === undefined) {
      throw new InputError('input cannot use read only utxo')
    }
    const utxo: Utxo = input.input.utxo
    if (utxo.sourceChain === undefined) {
      inputs.push(input)
    } else {
      importedInputs.push(input)
    }
  }
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

export function buildAddSupernetValidatorTransaction (
  utxoSet: Utxo[],
  signersAddresses: Address[],
  fee: bigint,
  chain: PlatformBlockchain,
  nodeId: string | NodeId,
  stakePeriod: bigint,
  weight: bigint,
  supernetId: string | SupernetId,
  supernetAuth: SupernetAuth,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): AddSupernetValidatorTransaction {
  const inputs: TransferableInput[] = buildTransactionInputs([], utxoSet, signersAddresses, [
    new TransactionFee(chain, fee)
  ])
  const outputs: UserOutput[] = buildTransactionOutputs([], inputs, new TransactionFee(chain, fee), changeAddress)
  const validator: Validator = new Validator(
    typeof nodeId === 'string' ? new NodeId(nodeId) : nodeId,
    stakePeriod,
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
  signersAddresses: Address[],
  fee: bigint,
  chain: PlatformBlockchain,
  supernetAuthAddresses: string[],
  supernetAuthThreshold: number,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): CreateSupernetTransaction {
  const inputs: TransferableInput[] = buildTransactionInputs([], utxoSet, signersAddresses, [
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
  signersAddresses: Address[],
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
  signersAddresses: Address[],
  fee: bigint,
  chain: PlatformBlockchain,
  nodeId: string | NodeId,
  supernetId: string | SupernetId,
  supernetAuth: SupernetAuth,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): RemoveSupernetValidatorTransaction {
  const inputs: TransferableInput[] = buildTransactionInputs([], utxoSet, signersAddresses, [
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
  signersAddresses: Address[],
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
  const inputs: TransferableInput[] = buildTransactionInputs([], utxoSet, signersAddresses, [
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
  signersAddresses: Address[],
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
  const userInput: UserInput = new UserInput(assetId.value, chain, initialRewardPoolSupply, [changeAddress], 1, chain)
  const inputs: TransferableInput[] = buildTransactionInputs([userInput], utxoSet, signersAddresses, [
    new TransactionFee(chain, fee)
  ])
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
  signersAddresses: Address[],
  fee: bigint,
  chain: PlatformBlockchain,
  nodeId: string | NodeId,
  stakePeriod: bigint,
  supernetId: string | SupernetId,
  stakeAmount: bigint,
  stakedAssetId: string,
  shares: number,
  signer: BLSSigner,
  stakeAddresses: string[],
  stakeThreshold: number,
  stakeLocktime: bigint,
  rewardAddresses: string[],
  rewardThreshold: number,
  rewardLocktime: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): AddPermissionlessValidatorTransaction {
  const stakeData = new UserInput(
    stakedAssetId,
    chain,
    stakeAmount,
    stakeAddresses,
    stakeThreshold,
    chain,
    stakeLocktime
  )
  // sort set by locktime so stakeable locked are processed first
  // non stakeable utxos should not be present there as it would
  // throw an error during outputs building, we assume that the set
  // was pre sorted in order not to have those
  utxoSet.sort((a, b) => {
    return Number(b.output.locktime - a.output.locktime)
  })
  const inputs: TransferableInput[] = buildTransactionInputs([stakeData], utxoSet, signersAddresses, [
    new TransactionFee(chain, fee)
  ])
  const validator = new Validator(typeof nodeId === 'string' ? new NodeId(nodeId) : nodeId, stakePeriod, stakeAmount)
  const stake: TransferableOutput[] = buildStakeOutputs(stakeData, inputs)
  const rewardsOwner = new Secp256k1OutputOwners(rewardLocktime, rewardThreshold, Address.toAddresses(rewardAddresses))
  // same as for utxo set sorting because inputs are used to build the change outputs
  // also using locktime but in inverted order so change prioritizes lowest locktime
  // first and if mixed with unlocked utxos change will then be unlocked instead of
  // locked stakeable change output. Also note that here we did sorting after building
  // of the stake, because the stake must use the same order of inputs as the utxoSet
  // they were build from
  inputs.sort((a, b) => {
    return Number(a.input.utxo!.output.locktime - b.input.utxo!.output.locktime)
  })
  const outputs: UserOutput[] = buildTransactionOutputs(
    [stakeData],
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
  signersAddresses: Address[],
  fee: bigint,
  chain: PlatformBlockchain,
  nodeId: string | NodeId,
  stakePeriod: bigint,
  supernetId: string | SupernetId,
  stakeAmount: bigint,
  stakedAssetId: string,
  stakeAddresses: string[],
  stakeThreshold: number,
  stakeLocktime: bigint,
  rewardAddresses: string[],
  rewardThreshold: number,
  rewardLocktime: bigint,
  changeAddress: string,
  networkId: number,
  memo: string = ''
): AddPermissionlessDelegatorTransaction {
  const stakeData = new UserInput(
    stakedAssetId,
    chain,
    stakeAmount,
    stakeAddresses,
    stakeThreshold,
    chain,
    stakeLocktime
  )
  utxoSet.sort((a, b) => {
    return Number(b.output.locktime - a.output.locktime)
  })
  const inputs: TransferableInput[] = buildTransactionInputs([stakeData], utxoSet, signersAddresses, [
    new TransactionFee(chain, fee)
  ])
  const validator = new Validator(typeof nodeId === 'string' ? new NodeId(nodeId) : nodeId, stakePeriod, stakeAmount)
  const stake: TransferableOutput[] = buildStakeOutputs(stakeData, inputs)
  const rewardsOwner = new Secp256k1OutputOwners(rewardLocktime, rewardThreshold, Address.toAddresses(rewardAddresses))
  inputs.sort((a, b) => {
    return Number(a.input.utxo!.output.locktime - b.input.utxo!.output.locktime)
  })
  const outputs: UserOutput[] = buildTransactionOutputs(
    [stakeData],
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
