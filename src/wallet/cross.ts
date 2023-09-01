import { type JEVMAPI } from '../api'
import { JVM_ID, PLATFORMVM_ID, JEVM_ID, type Blockchain, type Crossable } from '../chain'
import { type MCNProvider } from '../juneo'
import { CrossError } from '../utils'
import { type MCNOperation, MCNOperationType } from './operation'
import {
  estimateEVMExportTransaction, estimateEVMImportTransaction, estimateJVMExportTransaction, estimateJVMImportTransaction,
  estimatePlatformExportTransaction, estimatePlatformImportTransaction, type FeeData
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
    const importFees: FeeData = await this.estimateImport(source, destination, assetId)
    const exportFees: FeeData = await this.estimateExport(source, destination, assetId)
    return [importFees, exportFees]
  }

  async estimateImport (source: Blockchain, destination: Blockchain, assetId: string): Promise<FeeData> {
    if (destination.vmId === JVM_ID) {
      return await estimateJVMImportTransaction(this.provider)
    } else if (destination.vmId === PLATFORMVM_ID) {
      return await estimatePlatformImportTransaction(this.provider)
    } else if (destination.vmId === JEVM_ID) {
      const api: JEVMAPI = this.provider.jevm[source.id]
      return await estimateEVMImportTransaction(api, assetId)
    }
    throw new CrossError(`destination vm id does not support cross: ${destination.vmId}`)
  }

  async estimateExport (source: Blockchain, destination: Blockchain, assetId: string): Promise<FeeData> {
    if (destination.vmId === JVM_ID) {
      return await estimateJVMExportTransaction(this.provider)
    } else if (destination.vmId === PLATFORMVM_ID) {
      return await estimatePlatformExportTransaction(this.provider)
    } else if (destination.vmId === JEVM_ID) {
      const api: JEVMAPI = this.provider.jevm[source.id]
      return await estimateEVMExportTransaction(api, assetId, destination)
    }
    throw new CrossError(`source vm id does not support cross: ${source.vmId}`)
  }
}

export class CrossOperation implements MCNOperation {
  type: MCNOperationType = MCNOperationType.Cross
  source: Blockchain & Crossable
  destination: Blockchain & Crossable
  assetId: string
  amount: bigint
  address: string

  constructor (source: Blockchain & Crossable, destination: Blockchain & Crossable, assetId: string, amount: bigint, address: string) {
    this.source = source
    this.destination = destination
    this.assetId = assetId
    this.amount = amount
    this.address = address
  }
}
