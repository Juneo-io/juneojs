import { ethers } from 'ethers'
import { AssetId, JEVMExportTransaction, JEVMImportTransaction } from '../transaction'
import { isHex } from './encoding'
import { type GetAssetDescriptionResponse } from '../api'
import { TokenAsset } from '../asset'
import { type MCNProvider } from '../juneo'
import { ChainError } from './errors'

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
  const response: GetAssetDescriptionResponse = await provider.jvm.getAssetDescription(assetId).catch((error) => {
    throw new ChainError(`could not fetch asset id ${assetId}: ${error.message}`)
  })
  return new TokenAsset(response.assetID, response.name, response.symbol, response.denomination)
}
