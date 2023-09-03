import { type JEVMAPI } from '../api'
import { JVM_ID, PLATFORMVM_ID, JEVM_ID, type Blockchain } from '../chain'
import { type MCNProvider } from '../juneo'
import { type Utxo } from '../transaction'
import { CrossError } from '../utils'
import { type MCNOperation, MCNOperationType } from './operation'
import {
  estimateEVMExportTransaction, estimateEVMImportTransaction, estimateJVMExportTransaction, estimateJVMImportTransaction,
  estimatePlatformExportTransaction, estimatePlatformImportTransaction, sendJVMExportTransaction, type FeeData, sendPlatformExportTransaction, sendJVMImportTransaction, sendPlatformImportTransaction
} from './transaction'
import { type JuneoWallet } from './wallet'

export class CrossManager {
  private readonly provider: MCNProvider
  private readonly wallet: JuneoWallet

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  verifyCrossOperation (operation: CrossOperation): void {
    if (operation.source.id === operation.destination.id) {
      throw new CrossError('source and destination chain cannot be the same')
    }
    const sourceVmId: string = operation.source.vmId
    if (sourceVmId !== JVM_ID || sourceVmId !== PLATFORMVM_ID || sourceVmId !== JEVM_ID) {
      throw new CrossError(`source vm id does not support cross: ${sourceVmId}`)
    }
    const destinationVmId: string = operation.destination.vmId
    if (destinationVmId !== JVM_ID || destinationVmId !== PLATFORMVM_ID || destinationVmId !== JEVM_ID) {
      throw new CrossError(`destination vm id does not support cross: ${destinationVmId}`)
    }
  }

  async estimateCross (source: Blockchain, destination: Blockchain, assetId: string): Promise<FeeData[]> {
    const exportFees: FeeData = await this.estimateExport(source, destination, assetId)
    const importFees: FeeData = await this.estimateImport(destination, assetId)
    return [exportFees, importFees]
  }

  async estimateImport (destination: Blockchain, assetId: string): Promise<FeeData> {
    if (destination.vmId === JVM_ID) {
      return await estimateJVMImportTransaction(this.provider)
    } else if (destination.vmId === PLATFORMVM_ID) {
      return await estimatePlatformImportTransaction(this.provider)
    } else if (destination.vmId === JEVM_ID) {
      const api: JEVMAPI = this.provider.jevm[destination.id]
      return await estimateEVMImportTransaction(api, assetId)
    }
    throw new CrossError(`destination vm id does not support cross: ${destination.vmId}`)
  }

  async estimateExport (source: Blockchain, destination: Blockchain, assetId: string): Promise<FeeData> {
    if (source.vmId === JVM_ID) {
      return await estimateJVMExportTransaction(this.provider)
    } else if (source.vmId === PLATFORMVM_ID) {
      return await estimatePlatformExportTransaction(this.provider)
    } else if (source.vmId === JEVM_ID) {
      const api: JEVMAPI = this.provider.jevm[source.id]
      return await estimateEVMExportTransaction(api, assetId, destination)
    }
    throw new CrossError(`source vm id does not support cross: ${source.vmId}`)
  }

  async export (
    source: Blockchain, destination: Blockchain, assetId: string, amount: bigint, address: string, importFee: FeeData, exportFee?: FeeData, utxoSet?: Utxo[]
  ): Promise<string> {
    if (source.vmId === JVM_ID) {
      return await sendJVMExportTransaction(this.provider, this.wallet, destination, assetId, amount, address, importFee.amount, exportFee, utxoSet)
    } else if (source.vmId === PLATFORMVM_ID) {
      return await sendPlatformExportTransaction(this.provider, this.wallet, destination, assetId, amount, address, importFee.amount, exportFee, utxoSet)
    }
    throw new CrossError(`source vm id does not support cross: ${source.vmId}`)
  }

  async import (
    source: Blockchain, destination: Blockchain, assetId: string, amount: bigint, address: string, importFee?: FeeData, utxoSet?: Utxo[]
  ): Promise<string> {
    if (destination.vmId === JVM_ID) {
      return await sendJVMImportTransaction(this.provider, this.wallet, source, assetId, amount, address, importFee, utxoSet)
    } else if (destination.vmId === PLATFORMVM_ID) {
      return await sendPlatformImportTransaction(this.provider, this.wallet, source, assetId, amount, address, importFee, utxoSet)
    }
    throw new CrossError(`destination vm id does not support cross: ${destination.vmId}`)
  }
}

export class CrossOperation implements MCNOperation {
  type: MCNOperationType = MCNOperationType.Cross
  source: Blockchain
  destination: Blockchain
  assetId: string
  amount: bigint
  address: string

  constructor (source: Blockchain, destination: Blockchain, assetId: string, amount: bigint, address: string) {
    this.source = source
    this.destination = destination
    this.assetId = assetId
    this.amount = amount
    this.address = address
  }
}
