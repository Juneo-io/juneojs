import { NetworkUtils, VMType, type AbstractUtxoAPI, type MCNProvider } from '../juneo'
import {
  AddPermissionlessDelegatorTransaction,
  AddPermissionlessDelegatorTransactionTypeId,
  AddPermissionlessValidatorTransaction,
  AddPermissionlessValidatorTransactionTypeId,
  AddSupernetValidatorTransaction,
  AddSupernetValidatorTransactionType,
  BlockchainId,
  BlockchainIdSize,
  CreateAssetTransactionTypeId,
  CreateChainTransaction,
  CreateChainTransactionTypeId,
  CreateSupernetTransaction,
  CreateSupernetTransactionTypeId,
  EVMExportTransactionTypeId,
  EVMImportTransactionTypeId,
  ImportTransaction,
  JEVMExportTransaction,
  JEVMImportTransaction,
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
  RemoveSupernetValidatorTransaction,
  RemoveSupernetValidatorTransactionTypeId,
  TransferSupernetOwnershipTransaction,
  TransferSupernetOwnershipTransactionTypeId,
  TransformSupernetTransactionTypeId,
  Utxo,
  type TransferableInput,
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
    await TransactionUtils.syncInputsUtxos(unsignedTx.inputs, api)
    if (unsignedTx instanceof ImportTransaction) {
      const sourceChain = getBlockchain(provider, unsignedTx.sourceChain)
      const sourceApi = getUtxoAPI(provider, sourceChain)
      await TransactionUtils.syncInputsUtxos(unsignedTx.importedInputs, sourceApi)
    }
  }

  private static async syncInputsUtxos (inputs: TransferableInput[], api: AbstractUtxoAPI): Promise<void> {
    for (const input of inputs) {
      const data = (await api.getTx(input.transactionId.value)).tx
      const tx = TransactionUtils.parseUnsignedTransaction(data)
      const output = tx.getOutput(input.utxoIndex)
      input.input.utxo = new Utxo(input.transactionId, input.utxoIndex, input.assetId, output.output)
    }
  }

  static getTypeIdName (typeId: number, networkId: number, chainId: string): string {
    const network = NetworkUtils.getNetworkFromId(networkId)
    const chain = network.getChain(chainId)
    if (chain.vm.type === VMType.EVM) {
      return TransactionUtils.getEVMTypeIdName(typeId)
    }
    switch (typeId) {
      case JVMBaseTransactionTypeId: {
        return 'JVM Base Transaction'
      }
      case CreateAssetTransactionTypeId: {
        return 'Create Asset Transaction'
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
      case RemoveSupernetValidatorTransactionTypeId: {
        return 'Remove Supernet Validator Transaction'
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

  private static getEVMTypeIdName (typeId: number): string {
    switch (typeId) {
      case EVMImportTransactionTypeId: {
        return 'EVM Import Transaction'
      }
      case EVMExportTransactionTypeId: {
        return 'EVM Export Transaction'
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
    const networkId = reader.readUInt32()
    const blockchainId = new BlockchainId(reader.read(BlockchainIdSize).toCB58())
    const network = NetworkUtils.getNetworkFromId(networkId)
    const chain = network.getChain(blockchainId.value)
    if (chain.vm.type === VMType.EVM) {
      return TransactionUtils.parseUnsignedEVMTransaction(data, typeId)
    }
    const notImplementedTypeIdError = new Error(`type id ${typeId} parsing is not implemented yet`)
    switch (typeId) {
      case JVMBaseTransactionTypeId: {
        return JVMBaseTransaction.parse(data)
      }
      case CreateAssetTransactionTypeId: {
        throw notImplementedTypeIdError
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
      case RemoveSupernetValidatorTransactionTypeId: {
        return RemoveSupernetValidatorTransaction.parse(data)
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
        return TransferSupernetOwnershipTransaction.parse(data)
      }
      case PlatformBaseTransactionTypeId: {
        return PlatformBaseTransaction.parse(data)
      }
      default: {
        throw new ParsingError(`unsupported transaction type id "${typeId}"`)
      }
    }
  }

  static parseUnsignedEVMTransaction (data: string | JuneoBuffer, typeId: number): UnsignedTransaction {
    switch (typeId) {
      case EVMImportTransactionTypeId: {
        return JEVMImportTransaction.parse(data)
      }
      case EVMExportTransactionTypeId: {
        return JEVMExportTransaction.parse(data)
      }
      default: {
        throw new ParsingError(`unsupported transaction type id "${typeId}"`)
      }
    }
  }
}
