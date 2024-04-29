export const WalletStatusFetcherTimeout: number = 60000
// too low delay may not give enough time to some vms to produce the transaction
// and/or the utxos after the transaction is accepted
export const WalletStatusFetcherDelay: number = 100

export const MaxInvalidNonceAttempts: number = 5
export const InvalidNonceRetryDelay: number = 1000

export const DefaultWrapEstimate: bigint = BigInt(55_000)
export const DefaultUnwrapEstimate: bigint = BigInt(45_000)
export const DefaultTransferEstimate: bigint = BigInt(200_000)
export const DefaultWithdrawEstimate: bigint = BigInt(100_000)
export const DefaultDepositEstimate: bigint = BigInt(100_000)
export const DefaultRedeemAuctionEstimate: bigint = BigInt(100_000)
export const DefaultWithdrawStreamEstimate: bigint = BigInt(100_000)
export const DefaultCancelStreamEstimate: bigint = BigInt(125_000)
