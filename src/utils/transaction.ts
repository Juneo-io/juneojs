import { type MCNProvider } from '../juneo'
import {
  AddPermissionlessDelegatorTransaction,
  AddPermissionlessDelegatorTransactionTypeId,
  AddPermissionlessValidatorTransaction,
  AddPermissionlessValidatorTransactionTypeId,
  AddSupernetValidatorTransactionType,
  CreateAssetTransactionTypeId,
  CreateChainTransactionTypeId,
  CreateSupernetTransaction,
  CreateSupernetTransactionTypeId,
  JVMBaseTransaction,
  JVMBaseTransactionTypeId,
  JVMExportTransactionTypeId,
  JVMImportTransactionTypeId,
  PlatformBaseTransaction,
  PlatformBaseTransactionTypeId,
  PlatformExportTransactionTypeId,
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
    for (const input of unsignedTx.getInputs()) {
      const data = (await api.getTx(input.transactionId.value)).tx
      const tx = TransactionUtils.parseUnsignedTransaction(data)
      const output = tx.outputs[input.utxoIndex]
      input.input.utxo = new Utxo(input.transactionId, input.utxoIndex, input.assetId, output.output)
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
        throw notImplementedTypeIdError
      }
      case JVMExportTransactionTypeId: {
        throw notImplementedTypeIdError
      }
      case AddSupernetValidatorTransactionType: {
        throw notImplementedTypeIdError
      }
      case CreateChainTransactionTypeId: {
        throw notImplementedTypeIdError
      }
      case CreateSupernetTransactionTypeId: {
        return CreateSupernetTransaction.parse(data)
      }
      case PlatformImportTransactionTypeId: {
        throw notImplementedTypeIdError
      }
      case PlatformExportTransactionTypeId: {
        throw notImplementedTypeIdError
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
