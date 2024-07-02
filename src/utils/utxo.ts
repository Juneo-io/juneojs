import { type AbstractUtxoAPI, type GetUTXOsResponse } from '../api'
import { type Blockchain, JEVM_ID, JVM_ID, PLATFORMVM_ID } from '../chain'
import { type MCNProvider } from '../juneo'
import { type Address, type Secp256k1Output, Secp256k1OutputTypeId, Utxo } from '../transaction'
import { Balance } from '../wallet'
import { WalletError } from './errors'

const UtxoRequestLimit: number = 1024

export async function fetchUtxos (
  utxoApi: AbstractUtxoAPI,
  addresses: string[],
  sourceChain?: string,
  transactionId?: string
): Promise<Utxo[]> {
  // use a set to avoid duplicates because getUtxos does not guarantee to provide unique
  // utxos between multiple calls. There could be some duplicates because of start/end indexes
  // or even if one transaction changes one of the utxos between two calls.
  const utxoSet = new Set<string>()
  const utxos: Utxo[] = []
  let utxoResponse: GetUTXOsResponse =
    sourceChain === undefined
      ? await utxoApi.getUTXOs(addresses, UtxoRequestLimit)
      : await utxoApi.getUTXOsFrom(addresses, sourceChain, UtxoRequestLimit)
  utxoResponse.utxos.forEach((data) => {
    const utxo: Utxo = Utxo.parse(data)
    utxo.sourceChain = sourceChain
    if (addUtxo(utxos, utxo, transactionId)) {
      utxoSet.add(`${utxo.transactionId.value}_${utxo.utxoIndex}}`)
    }
  })
  while (utxoResponse.numFetched === UtxoRequestLimit) {
    utxoResponse =
      sourceChain === undefined
        ? await utxoApi.getUTXOs(addresses, UtxoRequestLimit, utxoResponse.endIndex)
        : await utxoApi.getUTXOsFrom(addresses, sourceChain, UtxoRequestLimit, utxoResponse.endIndex)
    for (const data of utxoResponse.utxos) {
      const utxo: Utxo = Utxo.parse(data)
      utxo.sourceChain = sourceChain
      const key: string = `${utxo.transactionId.value}_${utxo.utxoIndex}}`
      if (utxoSet.has(key)) {
        continue
      }
      if (addUtxo(utxos, utxo, transactionId)) {
        utxoSet.add(`${utxo.transactionId.value}_${utxo.utxoIndex}}`)
      }
    }
  }
  return utxos
}

function addUtxo (utxos: Utxo[], utxo: Utxo, transactionId?: string): boolean {
  if (typeof transactionId !== 'string') {
    utxos.push(utxo)
    return true
  }
  if (transactionId === utxo.transactionId.value) {
    utxos.push(utxo)
    return true
  }
  return false
}

export function getUtxoSetHighestThreshold (utxoSet: Utxo[]): number {
  let highest = 1
  for (const utxo of utxoSet) {
    highest = Math.max(highest, utxo.output.threshold)
  }
  return highest
}

export function getUtxoSetUniqueAddresses (utxoSet: Utxo[]): Address[] {
  const addresses: Address[] = []
  for (const utxo of utxoSet) {
    for (const address of utxo.output.addresses) {
      if (!address.matchesList(addresses)) {
        addresses.push(address)
      }
    }
  }
  return addresses
}

export function getUtxoSetAssetAmountUtxos (utxoSet: Utxo[], assetId: string, amount: bigint): Utxo[] {
  const utxos: Utxo[] = []
  if (amount === BigInt(0)) {
    return utxos
  }
  let totalAmount = BigInt(0)
  for (const utxo of utxoSet) {
    if (utxo.assetId.value !== assetId || utxo.output.typeId !== Secp256k1OutputTypeId) {
      continue
    }
    totalAmount += (utxo.output as Secp256k1Output).amount
    utxos.push(utxo)
    if (totalAmount >= amount) {
      break
    }
  }
  return utxos
}

export function getUtxosAmountValues (utxoSet: Utxo[], source?: string): Map<string, bigint> {
  const values = new Map<string, bigint>()
  for (const utxo of utxoSet) {
    if (utxo.sourceChain !== source || utxo.output.typeId !== Secp256k1OutputTypeId) {
      continue
    }
    let value: bigint = (utxo.output as Secp256k1Output).amount
    const assetId: string = utxo.assetId.value
    if (values.has(assetId)) {
      value += values.get(assetId)!
    }
    values.set(assetId, value)
  }
  return values
}

export function calculateBalances (utxoSet: Utxo[], balances: Map<string, Balance>): void {
  const values: Map<string, bigint> = getUtxosAmountValues(utxoSet)
  for (const [key, value] of values) {
    if (!balances.has(key)) {
      balances.set(key, new Balance())
    }
    balances.get(key)!.update(value)
  }
  for (const [key, balance] of balances) {
    // force all balances that no longer have a value from calculation to 0 in order to prevent desync
    if (!values.has(key) && balance.getValue() !== BigInt(0)) {
      // make sure to actually update so as to cast the event to potential listeners
      balance.update(BigInt(0))
    }
  }
}

export function getUtxoAPI (provider: MCNProvider, chain: Blockchain): AbstractUtxoAPI {
  const vmId: string = chain.vm.id
  if (vmId === JVM_ID) {
    return provider.jvmApi
  } else if (vmId === PLATFORMVM_ID) {
    return provider.platformApi
  } else if (vmId === JEVM_ID) {
    return provider.jevmApi[chain.id]
  }
  throw new WalletError(`unsupported vm id does not provide utxo api: ${vmId}`)
}
