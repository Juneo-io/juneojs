import { JEVMExportTransaction, JEVMImportTransaction } from '../transaction'

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
