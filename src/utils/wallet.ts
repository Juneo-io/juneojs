import { type Blockchain, JVM_ID, PLATFORMVM_ID, JEVM_ID } from '../chain'
import { UserInput } from '../transaction'
import { type Spending, BaseSpending, type ExecutableOperation, type TransactionType, type MCNAccount } from '../wallet'
import { sha256, rmd160 } from './crypto'
import { isHex, hasHexPrefix, decodeCB58, isBase58, encodeBech32 } from './encoding'

export const JVMPrivateKeyPrefix = 'PrivateKey-'
const PrivateKeyLength: number = 64

export function sortSpendings (spendings: Spending[]): Map<string, Spending> {
  const values = new Map<string, Spending>()
  for (const spending of spendings) {
    const key: string = `${spending.chain.id}_${spending.assetId}`
    if (!values.has(key)) {
      values.set(key, new BaseSpending(spending.chain, spending.amount, spending.assetId))
    } else {
      values.get(key)!.amount += spending.amount
    }
  }
  return values
}

export function getImportUserInputs (
  values: Map<string, bigint>,
  feeAssetId: string,
  feeAmount: bigint,
  source: Blockchain,
  destination: Blockchain,
  address: string
): UserInput[] {
  const inputs: UserInput[] = []
  for (const [key, value] of values) {
    const amount: bigint = key === feeAssetId ? value - feeAmount : value
    if (amount > BigInt(0)) {
      inputs.push(new UserInput(key, source, amount, [address], 1, destination))
    }
  }
  return inputs
}

export async function trackJuneoTransaction (
  chain: Blockchain,
  executable: ExecutableOperation,
  transactionId: string,
  transactionType: TransactionType
): Promise<boolean> {
  let success: boolean = false
  const vmId: string = chain.vmId
  if (vmId === JVM_ID) {
    success = await executable.trackJVMTransaction(transactionType, transactionId)
  } else if (vmId === PLATFORMVM_ID) {
    success = await executable.trackPlatformTransaction(transactionType, transactionId)
  } else if (vmId === JEVM_ID) {
    success = await executable.trackJEVMTransaction(chain.id, transactionType, transactionId)
  }
  return success
}

export function validatePrivateKey (data: string): boolean {
  if (isHex(data)) {
    const hasPrefix: boolean = hasHexPrefix(data)
    const length = hasPrefix ? data.substring(2).length : data.length
    return length === PrivateKeyLength
  }
  if (data.includes(JVMPrivateKeyPrefix)) {
    const split: string[] = data.split('-')
    const base58: boolean = split.length > 1 && isBase58(split[1])
    return base58 && decodeCB58(split[1]).length === PrivateKeyLength / 2
  }
  return false
}

export function encodeJuneoAddress (publicKey: string, hrp: string): string {
  return encodeBech32(hrp, rmd160(sha256(publicKey)))
}

/**
 * Fetch the balances of all the registered assets of the chains of the accounts.
 */
export async function fetchAllChainsBalances (account: MCNAccount): Promise<void> {
  const promises: Array<Promise<void>> = []
  for (const chainAccount of account.chainAccounts.values()) {
    promises.push(chainAccount.fetchBalances(chainAccount.chain.getRegisteredAssets()))
  }
  await Promise.all(promises)
}
