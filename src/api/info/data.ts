
export interface IsBootstrappedResponse {
    isBootstrapped: boolean
}

export interface GetBlockchainIDResponse {
    blockchainID: string
}

export interface GetNetworkIDResponse {
    networkID: number
}

export interface GetNetworkNameResponse {
    networkName: string
}

export interface GetNodeIDResponse {
    nodeID: string
    nodePOP: NodePOP
}

export interface NodePOP {
    publicKey: string
    proofOfPossession: string
}

export interface GetNodeIPResponse {
    ip: string
}

export interface GetNodeVersionResponse {
    version: string
    databaseVersion: string
    gitCommit: string
    vmVersions: Record<string, string>
    rpcProtocolVersion: string
}

export interface GetTxFeeResponse {
    txFee: number
    createAssetTxFee: number
    createSupernetTxFee: number
    transformSupernetTxFee: number
    createBlockchainTxFee: number
    addPrimaryNetworkValidatorFee: number
    addPrimaryNetworkDelegatorFee: number
    addSupernetValidatorFee: number
    addSupernetDelegatorFee: number
}

export interface GetVMsResponse {
    vms: Record<string, string[]>
}

export interface PeersResponse {
    numPeers: number
    peers: Peer[]
}

export interface Peer {
    ip: string
    publicIP: string
    nodeID: string
    version: string
    lastSent: string
    lastReceived: string
    benched: string[]
    observedUptime: number
    observedSupernetUptime: Record<string, number>
}

export interface UptimeResponse {
    rewardingStakePercentage: number
    weightedAveragePercentage: number
}
