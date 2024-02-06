import { type AbstractUtxoAPI, type GetUTXOsResponse } from '../api'
import { type Blockchain, JEVM_ID, JVM_ID, PLATFORMVM_ID } from '../chain'
import { type MCNProvider } from '../juneo'
import { type Secp256k1Output, Secp256k1OutputTypeId, Utxo } from '../transaction'
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
      utxoSet.add(`${utxo.transactionId.transactionId}_${utxo.utxoIndex}}`)
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
      const key: string = `${utxo.transactionId.transactionId}_${utxo.utxoIndex}}`
      if (utxoSet.has(key)) {
        continue
      }
      if (addUtxo(utxos, utxo, transactionId)) {
        utxoSet.add(`${utxo.transactionId.transactionId}_${utxo.utxoIndex}}`)
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
  if (transactionId === utxo.transactionId.transactionId) {
    utxos.push(utxo)
    return true
  }
  return false
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
      value += values.get(assetId)!
    }
    values.set(assetId, value)
  }
  return values
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
