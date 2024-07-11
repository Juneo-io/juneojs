import { type MCNProvider } from '../juneo'
import {
  AddPermissionlessDelegatorTransaction,
  AddPermissionlessDelegatorTransactionTypeId,
  AddPermissionlessValidatorTransaction,
  AddPermissionlessValidatorTransactionTypeId,
  AddSupernetValidatorTransaction,
  AddSupernetValidatorTransactionType,
  CreateAssetTransactionTypeId,
  CreateChainTransaction,
  CreateChainTransactionTypeId,
  CreateSupernetTransaction,
  CreateSupernetTransactionTypeId,
  type ExportTransaction,
  ImportTransaction,
  JVMBaseTransaction,
  JVMBaseTransactionTypeId,
  JVMExportTransaction,
  JVMExportTransactionTypeId,
  JVMImportTransaction,
  JVMImportTransactionTypeId,
  PlatformBaseTransaction,
  PlatformBaseTransactionTypeId,
  PlatformExportTransaction,
  PlatformExportTransactionTypeId,
  PlatformImportTransaction,
  PlatformImportTransactionTypeId,
  RemoveSupernetTransactionTypeId,
  TransferSupernetOwnershipTransactionTypeId,
  TransformSupernetTransactionTypeId,
  Utxo,
  type UnsignedTransaction
} from '../transaction'
import { JuneoBuffer } from './bytes'
import { getBlockchain } from './chain'
import { ParsingError } from './errors'
import { getUtxoAPI } from './utxo'

export class TransactionUtils {
  private static INSTANCE: TransactionUtils | undefined

  private constructor () {}

  static getSingleton (): TransactionUtils {
    if (TransactionUtils.INSTANCE === undefined) {
      TransactionUtils.INSTANCE = new TransactionUtils()
    }
    return TransactionUtils.INSTANCE
  }

  static async syncUtxos (provider: MCNProvider, unsignedTx: UnsignedTransaction): Promise<void> {
    const chain = getBlockchain(provider, unsignedTx.blockchainId)
    const api = getUtxoAPI(provider, chain)
    for (const input of unsignedTx.inputs) {
      const data = (await api.getTx(input.transactionId.value)).tx
      const tx = TransactionUtils.parseUnsignedTransaction(data)
      const output = tx.outputs[input.utxoIndex]
      input.input.utxo = new Utxo(input.transactionId, input.utxoIndex, input.assetId, output.output)
    }
    if (unsignedTx instanceof ImportTransaction) {
      const sourceChain = getBlockchain(provider, unsignedTx.sourceChain)
      const sourceApi = getUtxoAPI(provider, sourceChain)
      for (const input of unsignedTx.importedInputs) {
        const data = (await sourceApi.getTx(input.transactionId.value)).tx
        const exportTx = TransactionUtils.parseUnsignedTransaction(data) as ExportTransaction
        const output = exportTx.exportedOutputs[input.utxoIndex]
        input.input.utxo = new Utxo(input.transactionId, input.utxoIndex, input.assetId, output.output)
      }
    }
  }

  static getTypeIdName (typeId: number): string {
    switch (typeId) {
      case JVMBaseTransactionTypeId: {
        return 'JVM Base Transaction'
        // it has the same id as EVMImportTx
        // when it is implemented try the other if this one failed
      }
      case CreateAssetTransactionTypeId: {
        return 'Create Asset Transaction'
        // it has the same id as EVMExportTx
        // when it is implemented try the other if this one failed
      }
      case JVMImportTransactionTypeId: {
        return 'JVM Import Transaction'
      }
      case JVMExportTransactionTypeId: {
        return 'JVM Export Transaction'
      }
      case AddSupernetValidatorTransactionType: {
        return 'Add Supernet Validator Transaction'
      }
      case CreateChainTransactionTypeId: {
        return 'Create Chain Transaction'
      }
      case CreateSupernetTransactionTypeId: {
        return 'Create Supernet Transaction'
      }
      case PlatformImportTransactionTypeId: {
        return 'Platform Import Transaction'
      }
      case PlatformExportTransactionTypeId: {
        return 'Platform Export Transaction'
      }
      case RemoveSupernetTransactionTypeId: {
        return 'Remove Supernet Transaction'
      }
      case TransformSupernetTransactionTypeId: {
        return 'Transform Supernet Transaction'
      }
      case AddPermissionlessValidatorTransactionTypeId: {
        return 'Add Permissionless Validator Transaction'
      }
      case AddPermissionlessDelegatorTransactionTypeId: {
        return 'Add Permissionless Delegator Transaction'
      }
      case TransferSupernetOwnershipTransactionTypeId: {
        return 'Transfer Supernet Ownership Transaction'
      }
      case PlatformBaseTransactionTypeId: {
        return 'Platform Base Transaction'
      }
      default: {
        throw new ParsingError(`unsupported transaction type id "${typeId}"`)
      }
    }
  }

  static parseUnsignedTransaction (data: string | JuneoBuffer): UnsignedTransaction {
    const reader = JuneoBuffer.from(data).createReader()
    // skip codec reading
    reader.skip(2)
    const typeId = reader.readUInt32()
    const notImplementedTypeIdError = new Error(`type id ${typeId} parsing is not implemented yet`)
    switch (typeId) {
      case JVMBaseTransactionTypeId: {
        return JVMBaseTransaction.parse(data)
        // it has the same id as EVMImportTx
        // when it is implemented try the other if this one failed
      }
      case CreateAssetTransactionTypeId: {
        throw notImplementedTypeIdError
        // it has the same id as EVMExportTx
        // when it is implemented try the other if this one failed
      }
      case JVMImportTransactionTypeId: {
        return JVMImportTransaction.parse(data)
      }
      case JVMExportTransactionTypeId: {
        return JVMExportTransaction.parse(data)
      }
      case AddSupernetValidatorTransactionType: {
        return AddSupernetValidatorTransaction.parse(data)
      }
      case CreateChainTransactionTypeId: {
        return CreateChainTransaction.parse(data)
      }
      case CreateSupernetTransactionTypeId: {
        return CreateSupernetTransaction.parse(data)
      }
      case PlatformImportTransactionTypeId: {
        return PlatformImportTransaction.parse(data)
      }
      case PlatformExportTransactionTypeId: {
        return PlatformExportTransaction.parse(data)
      }
      case RemoveSupernetTransactionTypeId: {
        throw notImplementedTypeIdError
      }
      case TransformSupernetTransactionTypeId: {
        throw notImplementedTypeIdError
      }
      case AddPermissionlessValidatorTransactionTypeId: {
        return AddPermissionlessValidatorTransaction.parse(data)
      }
      case AddPermissionlessDelegatorTransactionTypeId: {
        return AddPermissionlessDelegatorTransaction.parse(data)
      }
      case TransferSupernetOwnershipTransactionTypeId: {
        throw notImplementedTypeIdError
      }
      case PlatformBaseTransactionTypeId: {
        return PlatformBaseTransaction.parse(data)
      }
      default: {
        throw new ParsingError(`unsupported transaction type id "${typeId}"`)
      }
    }
  }
}
