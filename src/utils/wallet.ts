import { type AbstractUtxoAPI, type JEVMAPI } from '../api'
import { JVM_ID, type Blockchain, PLATFORMVM_ID, JEVM_ID } from '../chain'
import { type MCNProvider } from '../juneo'
import { type Utxo, Secp256k1OutputTypeId, type Secp256k1Output, UserInput } from '../transaction'
import { type Spending, BaseSpending, type ExecutableOperation, type TransactionType } from '../wallet'
import { WalletError } from './errors'

export function sortSpendings (spendings: Spending[]): Map<string, Spending> {
  const values = new Map<string, Spending>()
  for (const spending of spendings) {
    const key: string = `${spending.chain.id}_${spending.assetId}`
    if (!values.has(key)) {
      values.set(key, new BaseSpending(spending.chain, spending.amount, spending.assetId))
    } else {
      ;(values.get(key) as Spending).amount += spending.amount
    }
  }
  return values
}

export function getUtxosAmountValues (utxoSet: Utxo[], source?: string): Map<string, bigint> {
  const values = new Map<string, bigint>()
  for (const utxo of utxoSet) {
    if (utxo.sourceChain !== source || utxo.output.typeId !== Secp256k1OutputTypeId) {
      continue
    }
    let value: bigint = (utxo.output as Secp256k1Output).amount
    const assetId: string = utxo.assetId.assetId
    if (values.has(assetId)) {
      value += values.get(assetId) as bigint
    }
    values.set(assetId, value)
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
      inputs.push(new UserInput(key, source, amount, address, destination))
    }
  }
  return inputs
}

export function getUtxoAPI (provider: MCNProvider, chain: Blockchain): AbstractUtxoAPI {
  const vmId: string = chain.vmId
  if (vmId === JVM_ID) {
    return provider.jvm
  } else if (vmId === PLATFORMVM_ID) {
    return provider.platform
  } else if (vmId === JEVM_ID) {
    return provider.jevm[chain.id]
  }
  throw new WalletError(`unsupported vm id does not provide utxo api: ${vmId}`)
}

export async function trackJuneoTransaction (
  provider: MCNProvider,
  chain: Blockchain,
  executable: ExecutableOperation,
  transactionId: string,
  transactionType: TransactionType
): Promise<boolean> {
  let success: boolean = false
  const vmId: string = chain.vmId
  if (vmId === JVM_ID) {
    success = await executable.addTrackedJVMTransaction(provider.jvm, transactionType, transactionId)
  } else if (vmId === PLATFORMVM_ID) {
    success = await executable.addTrackedPlatformTransaction(provider.platform, transactionType, transactionId)
  } else if (vmId === JEVM_ID) {
    const api: JEVMAPI = provider.jevm[chain.id]
    success = await executable.addTrackedJEVMTransaction(api, transactionType, transactionId)
  }
  return success
}
