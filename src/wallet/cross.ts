import { type AbstractUtxoAPI, type JEVMAPI } from '../api'
import { JVM_ID, PLATFORMVM_ID, JEVM_ID, type Blockchain } from '../chain'
import { type MCNProvider } from '../juneo'
import { fetchUtxos, type Utxo } from '../transaction'
import { CrossError } from '../utils'
import { type ChainAccount, type MCNAccount, type UtxoAccount } from './account'
import { type MCNOperation, MCNOperationType, type ExecutableMCNOperation, type MCNOperationSummary } from './operation'
import {
  estimateEVMExportTransaction, estimateEVMImportTransaction, estimateJVMExportTransaction, estimateJVMImportTransaction,
  estimatePlatformExportTransaction, estimatePlatformImportTransaction, sendJVMExportTransaction, type FeeData,
  sendPlatformExportTransaction, sendJVMImportTransaction, sendPlatformImportTransaction, sendEVMImportTransaction, sendEVMExportTransaction, type BaseFeeData, TransactionType
} from './transaction'
import { type JuneoWallet } from './wallet'

export class CrossManager {
  private readonly provider: MCNProvider
  private readonly wallet: JuneoWallet

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  async estimateImport (destination: Blockchain, assetId: string): Promise<BaseFeeData> {
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

  async estimateExport (source: Blockchain, destination: Blockchain, assetId: string): Promise<BaseFeeData> {
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

  async executeCrossOperation (executable: ExecutableMCNOperation, account: MCNAccount): Promise<void> {
    const summary: MCNOperationSummary = executable.summary
    const operation: MCNOperation = summary.operation
    if (operation.type !== MCNOperationType.Cross) {
      throw new CrossError(`operation ${operation.type} is forbidden`)
    }
    const cross: CrossOperation = operation as CrossOperation
    const exportFee: FeeData = executable.summary.fees[0]
    const importFee: FeeData = executable.summary.fees[1]
    let sourceUtxos: Utxo[] = []
    const sourceAccount: ChainAccount = account.getAccount(cross.source.id)
    const sourceVmId: string = sourceAccount.chain.vmId
    if (sourceVmId === JVM_ID || sourceVmId === PLATFORMVM_ID) {
      sourceUtxos = (sourceAccount as UtxoAccount).utxoSet
    }
    const exportTransactionId: string = await this.export(
      cross.source, cross.destination, cross.assetId, cross.amount, cross.address, cross.sendImportFee, importFee, exportFee, sourceUtxos
    )
    let exportSuccess: boolean = false
    if (sourceVmId === JVM_ID) {
      exportSuccess = await executable.addTrackedJVMTransaction(this.provider.jvm, TransactionType.Export, exportTransactionId)
    } else if (sourceVmId === PLATFORMVM_ID) {
      exportSuccess = await executable.addTrackedPlatformTransaction(this.provider.platform, TransactionType.Export, exportTransactionId)
    } else if (sourceVmId === JEVM_ID) {
      const api: JEVMAPI = this.provider.jevm[sourceAccount.chain.id]
      exportSuccess = await executable.addTrackedJEVMTransaction(api, TransactionType.Export, exportTransactionId)
    }
    if (!exportSuccess) {
      throw new CrossError(`error during export transaction ${exportTransactionId} status fetching`)
    }
    const destinationAccount: ChainAccount = account.getAccount(cross.destination.id)
    const destinationVmId: string = destinationAccount.chain.vmId
    let utxoApi: AbstractUtxoAPI | undefined
    if (destinationVmId === JVM_ID) {
      utxoApi = this.provider.jvm
    } else if (destinationVmId === PLATFORMVM_ID) {
      utxoApi = this.provider.platform
    } else if (destinationVmId === JEVM_ID) {
      utxoApi = this.provider.jevm[destinationAccount.chain.id]
    }
    if (utxoApi === undefined) {
      throw new CrossError(`unsupported destination vm id: ${destinationVmId}`)
    }
    // fetch imported utxos
    const destinationUtxos: Utxo[] = await fetchUtxos(utxoApi, [destinationAccount.chainWallet.getAddress()], sourceAccount.chain.id)
    if (cross.sendImportFee && (sourceVmId === JVM_ID || sourceVmId === PLATFORMVM_ID)) {
      destinationUtxos.push(...(sourceAccount as UtxoAccount).utxoSet)
    }
    const importTransactionId: string = await this.import(
      cross.source, cross.destination, cross.assetId, cross.amount, cross.address, cross.sendImportFee, importFee, destinationUtxos
    )
    let importSuccess: boolean = false
    if (destinationVmId === JVM_ID) {
      importSuccess = await executable.addTrackedJVMTransaction(this.provider.jvm, TransactionType.Import, importTransactionId)
    } else if (destinationVmId === PLATFORMVM_ID) {
      importSuccess = await executable.addTrackedPlatformTransaction(this.provider.platform, TransactionType.Import, importTransactionId)
    } else if (destinationVmId === JEVM_ID) {
      const api: JEVMAPI = this.provider.jevm[sourceAccount.chain.id]
      importSuccess = await executable.addTrackedJEVMTransaction(api, TransactionType.Import, importTransactionId)
    }
    if (!importSuccess) {
      throw new CrossError(`error during import transaction ${importTransactionId} status fetching`)
    }
  }
}

export class CrossOperation implements MCNOperation {
  type: MCNOperationType = MCNOperationType.Cross
  source: Blockchain
  destination: Blockchain
  assetId: string
  amount: bigint
  address: string
  sendImportFee: boolean = true

  constructor (source: Blockchain, destination: Blockchain, assetId: string, amount: bigint, address: string) {
    this.source = source
    this.destination = destination
    this.assetId = assetId
    this.amount = amount
    this.address = address
  }
}
