import { type JEVMAPI } from '../api'
import { JVM_ID, PLATFORMVM_ID, JEVM_ID, type Blockchain } from '../chain'
import { type MCNProvider } from '../juneo'
import { type Utxo } from '../transaction'
import { CrossError } from '../utils'
import { type MCNOperation, MCNOperationType } from './operation'
import {
  estimateEVMExportTransaction, estimateEVMImportTransaction, estimateJVMExportTransaction, estimateJVMImportTransaction,
  estimatePlatformExportTransaction, estimatePlatformImportTransaction, sendJVMExportTransaction, type FeeData,
  sendPlatformExportTransaction, sendJVMImportTransaction, sendPlatformImportTransaction, sendEVMImportTransaction, sendEVMExportTransaction
} from './transaction'
import { type JuneoWallet } from './wallet'

export class CrossManager {
  private readonly provider: MCNProvider
  private readonly wallet: JuneoWallet

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    this.provider = provider
    this.wallet = wallet
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

  shouldSendImportFee (destination: Blockchain, importFee: bigint, importFeeAssetDestinationBalance: bigint, importFeeAssetSourceBalance: bigint): boolean {
    // verify if the destination account can pay the import fee with its funds
    const canPayImportFee: boolean = destination.vmId !== JEVM_ID
      ? importFeeAssetDestinationBalance >= importFee
      : false
    // will not export the import fee only if destination can pay
    // import fee and source does not have enough to export it
    const sendImportFee: boolean = canPayImportFee
      ? importFeeAssetSourceBalance >= importFee
      : true
    return sendImportFee
  }

  async export (
    source: Blockchain, destination: Blockchain, assetId: string, amount: bigint, address: string,
    sendImportFee: boolean = true, importFee?: FeeData, exportFee?: FeeData, utxoSet?: Utxo[]
  ): Promise<string> {
    if (source.id === destination.id) {
      throw new CrossError('source and destination chain cannot be the same')
    }
    if (source.vmId === JEVM_ID && destination.vmId === JEVM_ID) {
      throw new CrossError('cross between two JEVM is not supported')
    }
    if (typeof importFee === 'undefined') {
      importFee = await this.estimateImport(destination, assetId)
    }
    if (source.vmId === JVM_ID) {
      return await sendJVMExportTransaction(this.provider, this.wallet, destination, assetId, amount, address, sendImportFee, importFee.amount, exportFee, utxoSet)
    } else if (source.vmId === PLATFORMVM_ID) {
      return await sendPlatformExportTransaction(this.provider, this.wallet, destination, assetId, amount, address, sendImportFee, importFee.amount, exportFee, utxoSet)
    } else if (source.vmId === JEVM_ID) {
      const api: JEVMAPI = this.provider.jevm[source.id]
      return await sendEVMExportTransaction(this.provider, api, this.wallet, destination, assetId, amount, address, sendImportFee, importFee.amount, exportFee)
    }
    throw new CrossError(`source vm id does not support cross: ${source.vmId}`)
  }

  async import (
    source: Blockchain, destination: Blockchain, assetId: string, amount: bigint, address: string,
    payImportFee: boolean = false, importFee?: FeeData, utxoSet?: Utxo[]
  ): Promise<string> {
    if (source.id === destination.id) {
      throw new CrossError('source and destination chain cannot be the same')
    }
    if (source.vmId === JEVM_ID && destination.vmId === JEVM_ID) {
      throw new CrossError('cross between two JEVM is not supported')
    }
    if (destination.vmId === JVM_ID) {
      return await sendJVMImportTransaction(this.provider, this.wallet, source, assetId, amount, address, payImportFee, importFee, utxoSet)
    } else if (destination.vmId === PLATFORMVM_ID) {
      return await sendPlatformImportTransaction(this.provider, this.wallet, source, assetId, amount, address, payImportFee, importFee, utxoSet)
    } else if (source.vmId === JEVM_ID) {
      if (payImportFee) {
        throw new CrossError(`vm id ${source.vmId} cannot pay import fee`)
      }
      const api: JEVMAPI = this.provider.jevm[destination.id]
      return await sendEVMImportTransaction(this.provider, api, this.wallet, source, assetId, amount, address, importFee, utxoSet)
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
