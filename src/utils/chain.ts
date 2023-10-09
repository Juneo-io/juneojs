import { ethers } from 'ethers'
import { AssetId, JEVMExportTransaction, JEVMImportTransaction } from '../transaction'
import { isHex } from './encoding'
import { type JVMAPI, type GetAssetDescriptionResponse } from '../api'
import { TokenAsset } from '../asset'
import { ChainError } from './errors'
import { type MCNProvider } from '../juneo'

export const AtomicDenomination: bigint = BigInt(1_000_000_000)
const AtomicSignatureCost: bigint = BigInt(1_000)
const AtomicBaseCost: bigint = BigInt(10_000)

function calculateAtomicGas (size: bigint, signaturesCount: bigint): bigint {
  return size + AtomicSignatureCost * signaturesCount + AtomicBaseCost
}

export function estimateAtomicExportGas (
  chainAssetId: string,
  exportedAssets: string[],
  importFeeAssetId: string
): bigint {
  const signaturesCount: number = JEVMExportTransaction.estimateSignaturesCount(
    exportedAssets,
    chainAssetId,
    importFeeAssetId
  )
  const size: number = JEVMExportTransaction.estimateSize(signaturesCount)
  return calculateAtomicGas(BigInt(size), BigInt(signaturesCount))
}

export function estimateAtomicImportGas (inputsCount: number, outputsCount: number): bigint {
  const size: number = JEVMImportTransaction.estimateSize(inputsCount, outputsCount)
  return calculateAtomicGas(BigInt(size), BigInt(inputsCount))
}

export function calculateAtomicCost (gas: bigint, baseFee: bigint): bigint {
  return (gas * baseFee) / AtomicDenomination
}

export function isContractAddress (assetId: string): boolean {
  // ethers.isAddress supports also ICAP addresses so check if it is hex too
  return isHex(assetId) && ethers.isAddress(assetId)
}

export async function fetchJNT (provider: MCNProvider, assetId: string): Promise<TokenAsset> {
  if (AssetId.validate(assetId)) {
    throw new ChainError(`cannot fetch invalid asset id ${assetId}`)
  }
  const jvm: JVMAPI = provider.jvm
  if (jvm.chain.registeredAssets.has(assetId)) {
    return jvm.chain.registeredAssets.get(assetId) as TokenAsset
  }
  const response: GetAssetDescriptionResponse = await jvm.getAssetDescription(assetId).catch((error) => {
    throw new ChainError(`could not fetch asset id ${assetId}: ${error.message}`)
  })
  const asset: TokenAsset = new TokenAsset(response.assetID, response.name, response.symbol, response.denomination)
  // use the jvm registered assets as a cache
  jvm.chain.addRegisteredAsset(asset)
  return asset
}
