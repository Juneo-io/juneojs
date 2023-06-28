
export interface GetPlatformBalanceResponse {
  balance: number
  balances: Record<string, number>
  unlocked: number
  unlockeds: Record<string, number>
  lockedStakeable: number
  lockedStakeables: Record<string, number>
  lockedNotStakeable: number
  lockedNotStakeables: Record<string, number>
  utxoIDs: UtxoID[]
}

export interface UtxoID {
  txID: string
  outputIndex: number
}

export interface GetBlockResponse {
  block: string
  encoding: string
}

export interface GetBlockchainsResponse {
  blockchains: BlockchainData[]
}

export interface BlockchainData {
  id: string
  name: string
  supernetID: string
  vmID: string
  chainAssetID: string
}

export interface GetBlockchainStatusResponse {
  status: string
}

export interface GetCurrentSupplyResponse {
  supply: number
}

export interface GetCurrentValidatorsResponse {
  validators: ValidatorData[]
}

export interface ValidatorData {
  txID: string
  startTime: string
  endTime: string
  stakeAmount: string
  nodeID: string
  weight: string
  validationRewardOwner: RewardOwner
  delegationRewardOwner: RewardOwner
  potentialReward: string
  delegationFee: string
  uptime: string
  connected: boolean
  signer: Signer
  delegatorCount: string
  delegatorWeight: string
  delegators: DelegatorData[]
}

export interface RewardOwner {
  locktime: string
  threshold: string
  addresses: string[]
}

export interface Signer {
  publicKey: string
  proofOfPossession: string
}

export interface DelegatorData {
  txID: string
  startTime: string
  endTime: string
  stakeAmount: string
  nodeID: string
  rewardOwner: RewardOwner
  potentialReward: string
}

export interface GetHeightResponse {
  height: number
}

export interface GetMaxStakeAmountResponse {
  amount: number
}

export interface GetMinStakeResponse {
  minValidatorStake: number
  minDelegatorStake: number
}

export interface GetPendingValidatorsResponse {
  validators: PendingValidator[]
  delegators: PendingDelegator[]
}

export interface PendingValidator {
  txID: string
  startTime: string
  endTime: string
  stakeAmount: string
  nodeID: string
  delegationFee: string
  connected: boolean
  signer: Signer
  weight: string
}

export interface PendingDelegator {
  txID: string
  startTime: string
  endTime: string
  stakeAmount: string
  nodeID: string
}

export interface GetRewardUTXOsResponse {
  numFetched: number
  utxos: string[]
  encoding: string
}

export interface GetStakeResponse {
  staked: number
  stakeds: Record<string, number>
  stakedOutputs: string[]
  encoding: string
}

export interface GetStakingAssetIDResponse {
  assetID: string
}

export interface GetSupernetsResponse {
  supernets: SupernetData[]
}

export interface SupernetData {
  id: string
  controlKeys: string[]
  threshold: string
}

export interface GetTimestampResponse {
  time: string
}

export interface GetTotalStakeResponse {
  stake: number
  weight: number
}

export interface GetValidatorsAtResponse {
  validators: Record<string, number>
}

export interface SampleValidatorsResponse {
  validators: string[]
}

export interface ValidatedByResponse {
  supernetID: string
}

export interface ValidatesResponse {
  blockchainIDs: string[]
}
