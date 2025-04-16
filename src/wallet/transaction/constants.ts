export const WalletStatusFetcherTimeout: number = 60000
// too low delay may not give enough time to some vms to produce the transaction
// and/or the utxos after the transaction is accepted
export const WalletStatusFetcherDelay: number = 100

export const MaxInvalidNonceAttempts: number = 5
export const InvalidNonceRetryDelay: number = 1000

export const DefaultWithdrawEstimate: bigint = BigInt(200_000)
export const DefaultDepositEstimate: bigint = BigInt(200_000)
