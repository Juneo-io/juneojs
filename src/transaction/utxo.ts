import { TransferableOutput, type TransactionOutput } from './output'
import { AssetId, AssetIdSize, TransactionId, TransactionIdSize } from './types'
import { JuneoBuffer } from '../utils'
import { type AbstractUtxoAPI, type GetUTXOsResponse } from '../api'

const UtxoRequestLimit: number = 1024

export async function fetchUtxos (utxoSet: Map<string, Utxo>, utxoApi: AbstractUtxoAPI, addresses: string[], sourceChain?: string): Promise<void> {
  // use a mapping to avoid duplicates because get utxos calls are not guaranteed
  // to provide unique utxos. There could be some duplicates because of start/end indexes
  // or even if one transaction changes one of the utxos between two calls.
  let utxoResponse: GetUTXOsResponse = await utxoApi.getUTXOs(addresses, UtxoRequestLimit)
  parseUtxosIntoSet(utxoSet, utxoResponse.utxos, sourceChain)
  while (utxoResponse.numFetched === UtxoRequestLimit) {
    utxoResponse = await utxoApi.getUTXOs(addresses, UtxoRequestLimit, utxoResponse.endIndex)
    parseUtxosIntoSet(utxoSet, utxoResponse.utxos, sourceChain)
  }
}

function parseUtxosIntoSet (utxoSet: Map<string, Utxo>, utxos: string[], sourceChain?: string): void {
  utxos.forEach(data => {
    const utxo: Utxo = Utxo.parse(data)
    utxo.sourceChain = sourceChain
    utxoSet.set(`${utxo.transactionId.transactionId}_${utxo.utxoIndex}}`, utxo)
  })
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
