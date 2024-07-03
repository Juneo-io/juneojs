import { type AbstractUtxoAPI } from '../api'
import { type Blockchain, JEVM_ID, JVM_ID, PLATFORMVM_ID } from '../chain'
import { type MCNProvider } from '../juneo'
import { Address, type Secp256k1Output, Secp256k1OutputTypeId, Utxo } from '../transaction'
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
  let utxoResponse =
    sourceChain === undefined
      ? await utxoApi.getUTXOs(addresses, UtxoRequestLimit)
      : await utxoApi.getUTXOsFrom(addresses, sourceChain, UtxoRequestLimit)
  for (const data of utxoResponse.utxos) {
    const utxo = Utxo.parse(data)
    utxo.sourceChain = sourceChain
    if (addUtxo(utxos, utxo, transactionId)) {
      utxoSet.add(utxo.getUniqueId())
    }
  }
  while (utxoResponse.numFetched === UtxoRequestLimit) {
    utxoResponse =
      sourceChain === undefined
        ? await utxoApi.getUTXOs(addresses, UtxoRequestLimit, utxoResponse.endIndex)
        : await utxoApi.getUTXOsFrom(addresses, sourceChain, UtxoRequestLimit, utxoResponse.endIndex)
    for (const data of utxoResponse.utxos) {
      const utxo = Utxo.parse(data)
      utxo.sourceChain = sourceChain
      const key = utxo.getUniqueId()
      if (utxoSet.has(key)) {
        continue
      }
      if (addUtxo(utxos, utxo, transactionId)) {
        utxoSet.add(key)
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

export class UtxoSet {
  private static readonly ENCODING_HRP = 'key'
  private readonly expectedSigners: ExpectedSigner[] = []
  private readonly selectedSigners = new Map<string, Address>()
  utxos: Utxo[]

  constructor (utxos: Utxo[]) {
    this.utxos = utxos
    for (const utxo of utxos) {
      this.expectedSigners.push(new ExpectedSigner(utxo.output.addresses, utxo.output.threshold))
    }
  }

  getUniqueAddresses (): Address[] {
    const addresses: Address[] = []
    for (const utxo of this.utxos) {
      addresses.push(...utxo.output.addresses)
    }
    return Address.uniqueAddresses(addresses)
  }

  getSelectedSigners (): IterableIterator<Address> {
    return this.selectedSigners.values()
  }

  addSigner (address: Address): boolean {
    const key = address.encode(UtxoSet.ENCODING_HRP)
    // already added avoid duplicate entries
    if (this.selectedSigners.has(key)) {
      return false
    }
    // cannot sign this utxoSet
    if (!this.isValidSigner(address)) {
      return false
    }
    this.selectedSigners.set(key, address)
    return true
  }

  removeSigner (address: Address): boolean {
    const key = address.encode(UtxoSet.ENCODING_HRP)
    return this.selectedSigners.delete(key)
  }

  getMissingSignersAddresses (): Address[] {
    const missing: Address[] = []
    for (const expectedSigner of this.expectedSigners) {
      const threshold = expectedSigner.threshold
      const addresses: Address[] = []
      let selectedAmount = 0
      for (const address of expectedSigner.addresses) {
        if (this.selectedSigners.has(address.encode(UtxoSet.ENCODING_HRP))) {
          selectedAmount += 1
          continue
        }
        addresses.push(address)
      }
      if (selectedAmount < threshold) {
        for (const address of addresses) {
          if (address.matchesList(missing)) {
            continue
          }
          missing.push(address)
        }
      }
    }
    return missing
  }

  private isValidSigner (address: Address): boolean {
    for (const expectedSigner of this.expectedSigners) {
      if (address.matchesList(expectedSigner.addresses)) {
        return true
      }
    }
    return false
  }
}

class ExpectedSigner {
  addresses: Address[]
  threshold: number

  constructor (addresses: Address[], threshold: number) {
    this.addresses = addresses
    this.threshold = threshold
  }
}

export function getUtxoSetAssetAmountUtxos (
  utxoSet: Utxo[],
  assetId: string,
  amount: bigint,
  ignoredUtxos?: Utxo[]
): Utxo[] {
  const utxos: Utxo[] = []
  if (amount === BigInt(0)) {
    return utxos
  }
  const hasIgnoredUtxos = typeof ignoredUtxos !== 'undefined'
  let totalAmount = BigInt(0)
  for (const utxo of utxoSet) {
    if (utxo.assetId.value !== assetId || utxo.output.typeId !== Secp256k1OutputTypeId) {
      continue
    }
    if (hasIgnoredUtxos) {
      for (const ignored of ignoredUtxos) {
        if (utxo.getUniqueId() === ignored.getUniqueId()) {
          continue
        }
      }
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
