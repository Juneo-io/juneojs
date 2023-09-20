import { TransferableOutput, type TransactionOutput } from './output'
import { AssetId, AssetIdSize, TransactionId, TransactionIdSize } from './types'
import { JuneoBuffer } from '../utils'
import { type AbstractUtxoAPI, type GetUTXOsResponse } from '../api'

const UtxoRequestLimit: number = 1024

export async function fetchUtxos (
  utxoApi: AbstractUtxoAPI, addresses: string[], sourceChain?: string, transactionId?: string, index?: number
): Promise<Utxo[]> {
  // use a set to avoid duplicates because getUtxos does not guarantee to provide unique
  // utxos between multiple calls. There could be some duplicates because of start/end indexes
  // or even if one transaction changes one of the utxos between two calls.
  const utxoSet = new Set<string>()
  const utxos: Utxo[] = []
  let utxoResponse: GetUTXOsResponse = sourceChain === undefined
    ? await utxoApi.getUTXOs(addresses, UtxoRequestLimit)
    : await utxoApi.getUTXOsFrom(addresses, sourceChain, UtxoRequestLimit)
  utxoResponse.utxos.forEach(data => {
    const utxo: Utxo = Utxo.parse(data)
    utxo.sourceChain = sourceChain
    if (addUtxo(utxos, utxo, transactionId, index)) {
      utxoSet.add(`${utxo.transactionId.transactionId}_${utxo.utxoIndex}}`)
    }
  })
  while (utxoResponse.numFetched === UtxoRequestLimit) {
    utxoResponse = sourceChain === undefined
      ? await utxoApi.getUTXOs(addresses, UtxoRequestLimit, utxoResponse.endIndex)
      : await utxoApi.getUTXOsFrom(addresses, sourceChain, UtxoRequestLimit, utxoResponse.endIndex)
    for (const data of utxoResponse.utxos) {
      const utxo: Utxo = Utxo.parse(data)
      utxo.sourceChain = sourceChain
      const key: string = `${utxo.transactionId.transactionId}_${utxo.utxoIndex}}`
      if (utxoSet.has(key)) {
        continue
      }
      if (addUtxo(utxos, utxo, transactionId, index)) {
        utxoSet.add(`${utxo.transactionId.transactionId}_${utxo.utxoIndex}}`)
      }
    }
  }
  return utxos
}

function addUtxo (utxos: Utxo[], utxo: Utxo, transactionId?: string, index?: number): boolean {
  const transactionParam: boolean = typeof transactionId === 'string'
  const indexParam: boolean = typeof index === 'number'
  let success: boolean = false
  if (indexParam && transactionParam) {
    if (transactionId === utxo.transactionId.transactionId && index === utxo.utxoIndex) {
      utxos.push(utxo)
      success = true
    }
  } else if (transactionParam) {
    if (transactionId === utxo.transactionId.transactionId) {
      utxos.push(utxo)
      success = true
    }
  } else {
    utxos.push(utxo)
    success = true
  }
  return success
}

export class Utxo {
  transactionId: TransactionId
  utxoIndex: number
  assetId: AssetId
  output: TransactionOutput
  sourceChain?: string

  constructor (transactionId: TransactionId, utxoIndex: number, assetId: AssetId, output: TransactionOutput) {
    this.transactionId = transactionId
    this.utxoIndex = utxoIndex
    this.assetId = assetId
    this.output = output
  }

  static parse (data: string): Utxo {
    const buffer: JuneoBuffer = JuneoBuffer.fromString(data)
    let position: number = 0
    // skip codec reading
    position += 2
    const transactionId: TransactionId = new TransactionId(
      buffer.read(position, TransactionIdSize).toCB58()
    )
    position += TransactionIdSize
    const utxoIndex: number = buffer.readUInt32(position)
    position += 4
    const assetId: AssetId = new AssetId(
      buffer.read(position, AssetIdSize).toCB58()
    )
    position += AssetIdSize
    const outputBuffer: JuneoBuffer = buffer.read(position, buffer.length - 1)
    const output: TransactionOutput = TransferableOutput.parseOutput(outputBuffer)
    return new Utxo(transactionId, utxoIndex, assetId, output)
  }
}
