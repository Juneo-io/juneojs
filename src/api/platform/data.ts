/**
 * @deprecated
 */
export interface GetBlockchainsResponse {
  blockchains: BlockchainData[]
}

/**
 * @deprecated
 */
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
  supply: bigint
}

export interface GetRewardPoolSupplyResponse {
  rewardPoolSupply: bigint
}

export interface GetCurrentValidatorsResponse {
  validators: ValidatorData[]
}

export interface ValidatorData {
  txID: string
  startTime: bigint
  endTime: bigint
  weight: bigint
  nodeID: string
  stakeAmount: bigint
  rewardOwner: RewardOwner
  validationRewardOwner: RewardOwner
  delegationRewardOwner: RewardOwner
  potentialReward: bigint
  accruedDelegateeReward: bigint
  delegationFee: number
  uptime: number
  connected: boolean
  signer: ValidatorSigner
  delegatorCount: number
  delegatorWeight: bigint
  delegators: DelegatorData[]
}

export interface RewardOwner {
  locktime: bigint
  threshold: number
  addresses: string[]
}

export interface ValidatorSigner {
  publicKey: string
  proofOfPossession: string
}

export interface DelegatorData {
  txID: string
  startTime: bigint
  endTime: bigint
  weight: bigint
  nodeID: string
  stakeAmount: bigint
  rewardOwner: RewardOwner
  potentialReward: bigint
}

export interface GetMinStakeResponse {
  minValidatorStake: bigint
  minDelegatorStake: bigint
}

export interface GetStakingAssetIDResponse {
  assetID: string
}

/**
 * @deprecated
 */
export interface GetSupernetsResponse {
  supernets: SupernetData[]
}

/**
 * @deprecated
 */
export interface SupernetData {
  id: string
  controlKeys: string[]
  threshold: number
}

export interface GetTimestampResponse {
  timestamp: string
}

export interface GetTotalStakeResponse {
  stake: bigint
  weight: bigint
}

export interface GetValidatorsAtResponse {
  validators: Record<string, ValidatorAtData>
}

export interface ValidatorAtData {
  publicKey: string
  weight: bigint
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
