import { TransferableOutput, type TransactionOutput } from './output'
import { AssetId, AssetIdSize, TransactionId, TransactionIdSize } from './types'
import { JuneoBuffer } from '../utils'
import { type AbstractUtxoAPI, type GetUTXOsResponse } from '../api'

const UtxoRequestLimit: number = 1024

export async function fetchUtxos (utxoApi: AbstractUtxoAPI, addresses: string[], sourceChain?: string): Promise<Utxo[]> {
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
    utxoSet.add(`${utxo.transactionId.transactionId}_${utxo.utxoIndex}}`)
    utxos.push(utxo)
  })
  while (utxoResponse.numFetched === UtxoRequestLimit) {
    utxoResponse = sourceChain === undefined
      ? await utxoApi.getUTXOs(addresses, UtxoRequestLimit, utxoResponse.endIndex)
      : await utxoApi.getUTXOsFrom(addresses, sourceChain, UtxoRequestLimit, utxoResponse.endIndex)
    utxoResponse.utxos.forEach(data => {
      const utxo: Utxo = Utxo.parse(data)
      utxo.sourceChain = sourceChain
      const key: string = `${utxo.transactionId.transactionId}_${utxo.utxoIndex}}`
      if (!utxoSet.has(key)) {
        utxoSet.add(`${utxo.transactionId.transactionId}_${utxo.utxoIndex}}`)
        utxos.push(utxo)
      }
    })
  }
  return utxos
}

export function parseUtxoSet (data: GetUTXOsResponse, sourceChain?: string): Utxo[] {
  const utxos: string[] = data.utxos
  const utxoSet: Utxo[] = []
  utxos.forEach(next => {
    const utxo: Utxo = Utxo.parse(next)
    utxo.sourceChain = sourceChain
    utxoSet.push(utxo)
  })
  return utxoSet
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
