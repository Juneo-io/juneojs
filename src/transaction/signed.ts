import { JuneoBuffer, ParsingError } from '../utils'
import {
  AddPermissionlessDelegatorTransactionTypeId,
  AddPermissionlessValidatorTransactionTypeId,
  AddSupernetValidatorTransactionType,
  CreateAssetTransactionTypeId,
  CreateChainTransactionTypeId,
  CreateSupernetTransactionTypeId,
  JVMBaseTransactionTypeId,
  JVMExportTransactionTypeId,
  JVMImportTransactionTypeId,
  PlatformBaseTransactionTypeId,
  PlatformExportTransactionTypeId,
  PlatformImportTransactionTypeId,
  RemoveSupernetTransactionTypeId,
  TransferSupernetOwnershipTransactionTypeId,
  TransformSupernetTransactionTypeId
} from './constants'
import { JVMBaseTransaction } from './jvm'
import {
  AddPermissionlessDelegatorTransaction,
  AddPermissionlessValidatorTransaction,
  CreateSupernetTransaction,
  PlatformBaseTransaction
} from './platform'
import { TransactionCredentials } from './signature'
import { type UnsignedTransaction } from './transaction'

export class SignedTransaction {
  unsignedTransaction: UnsignedTransaction
  signatures: TransactionCredentials[]

  constructor (unsignedTransaction: UnsignedTransaction, credentials: TransactionCredentials[]) {
    this.unsignedTransaction = unsignedTransaction
    this.signatures = credentials
  }

  static parse (data: string | JuneoBuffer): SignedTransaction {
    const buffer = JuneoBuffer.from(data)
    const reader = buffer.createReader()
    const unsignedTransaction = SignedTransaction.parseUnsignedTransaction(data)
    reader.skip(unsignedTransaction.serialize().length)
    const credentials: TransactionCredentials[] = []
    const credentialsLength = reader.readUInt32()
    for (let i = 0; i < credentialsLength; i++) {
      credentials.push(
        TransactionCredentials.parse(buffer.read(reader.getCursor(), buffer.length - reader.getCursor()))
      )
    }
    return new SignedTransaction(unsignedTransaction, credentials)
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
