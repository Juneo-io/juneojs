import { type AbstractUtxoAPI, type JEVMAPI } from '../api'
import { JVM_ID, PLATFORMVM_ID, JEVM_ID, type Blockchain, SocotraJUNEChain, JEVMBlockchain, type JVMBlockchain, type JRC20Asset } from '../chain'
import { type MCNProvider } from '../juneo'
import { fetchUtxos, type Utxo } from '../transaction'
import { CrossError } from '../utils'
import { type EVMAccount, type ChainAccount, type MCNAccount, type UtxoAccount } from './account'
import { type MCNOperation, MCNOperationType, type ExecutableMCNOperation, MCNOperationSummary } from './operation'
import {
  estimateEVMExportTransaction, estimateEVMImportTransaction, estimateJVMExportTransaction, estimateJVMImportTransaction,
  estimatePlatformExportTransaction, estimatePlatformImportTransaction, sendJVMExportTransaction, type FeeData,
  sendPlatformExportTransaction, sendJVMImportTransaction, sendPlatformImportTransaction, sendEVMImportTransaction,
  sendEVMExportTransaction, type BaseFeeData, TransactionType, type Spending, BaseSpending, FeeType, type EVMFeeData, estimateEVMWithdrawJRC20, sendEVMTransaction, estimateEVMDepositJRC20
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

  shouldProxy (cross: CrossOperation): boolean {
    // with current logic we do not want june funds to be in other EVMs
    // that puts a constraint that if we want to export funds from another EVM to the JUNE chain we in fact
    // do not have june in it to be able to export the fee. Added to the contraint of EVM that are using nonce
    // accounts and not utxos account, it is not possible to pay the import fee with the destination balance.
    // to solve that problem, we use the JVM to do a proxy in this transaction. JVM having utxos accounts it is
    // so possible to export only of EVM's chain asset and then pay the import fee in the JVM in june. Then the
    // initial cross transaction can be finalized by doing a regular JVM to JUNE chain cross transaction with the
    // initial exported funds towards it.
    return cross.source.vmId === JEVM_ID && cross.destination.vmId === JEVM_ID && cross.source.id !== SocotraJUNEChain.id
  }

  async export (
    source: Blockchain, destination: Blockchain, assetId: string, amount: bigint, address: string,
    sendImportFee: boolean = true, importFee?: FeeData, exportFee?: FeeData, utxoSet?: Utxo[]
  ): Promise<string> {
    if (source.id === destination.id) {
      throw new CrossError('source and destination chain cannot be the same')
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
    // jevm cross transactions amount must be changed because of atomic denominator
    if (source.vmId === JEVM_ID && assetId === source.assetId) {
      amount /= JEVMBlockchain.AtomicDenomination
    }
    if (destination.vmId === JVM_ID) {
      return await sendJVMImportTransaction(this.provider, this.wallet, source, assetId, amount, address, payImportFee, importFee, utxoSet)
    } else if (destination.vmId === PLATFORMVM_ID) {
      return await sendPlatformImportTransaction(this.provider, this.wallet, source, assetId, amount, address, payImportFee, importFee, utxoSet)
    } else if (destination.vmId === JEVM_ID) {
      if (payImportFee) {
        throw new CrossError(`vm id ${destination.vmId} cannot pay import fee`)
      }
      const api: JEVMAPI = this.provider.jevm[destination.id]
      return await sendEVMImportTransaction(this.provider, api, this.wallet, source, assetId, amount, address, importFee, utxoSet)
    }
    throw new CrossError(`destination vm id does not support cross: ${destination.vmId}`)
  }

  async estimateCrossOperation (cross: CrossOperation, account: MCNAccount): Promise<MCNOperationSummary> {
    const juneChain: JEVMBlockchain = SocotraJUNEChain
    if (this.shouldProxy(cross)) {
      const chains: Blockchain[] = [cross.source, this.provider.jvm.chain, cross.destination]
      const proxyExport: CrossOperation = new CrossOperation(cross.source, this.provider.jvm.chain, cross.assetId, cross.amount, cross.address)
      const exportSummary: MCNOperationSummary = await this.estimateCrossOperation(proxyExport, account)
      const spendings: Spending[] = [...exportSummary.spendings]
      // in proxy will only use the jvm chain to spend fees so do not care about june chain balance eventhough it will require fees
      const jvm: JVMBlockchain = this.provider.jvm.chain
      const proxyImport: CrossOperation = new CrossOperation(this.provider.jvm.chain, cross.destination, cross.assetId, cross.amount, cross.address)
      const importSummary: MCNOperationSummary = await this.estimateCrossOperation(proxyImport, account)
      spendings.push(new BaseSpending(jvm, importSummary.fees[0].amount, jvm.assetId))
      spendings.push(new BaseSpending(jvm, importSummary.fees[1].amount, jvm.assetId))
      const fees: FeeData[] = [...exportSummary.fees, ...importSummary.fees]
      if (cross.destination.id === juneChain.id) {
        for (let i = 0; i < juneChain.jrc20Assets.length; i++) {
          const jrc20: JRC20Asset = juneChain.jrc20Assets[i]
          if (jrc20.nativeAssetId === cross.assetId) {
            const sender: string = account.getAccount(juneChain.id).addresses[0]
            const fee: EVMFeeData = await estimateEVMDepositJRC20(this.provider.jevm[juneChain.id], sender, jrc20, cross.amount)
            fees.push(fee)
            spendings.push(new BaseSpending(jvm, fee.amount / JEVMBlockchain.AtomicDenomination, jvm.assetId))
            break
          }
        }
      }
      return new MCNOperationSummary(cross, chains, fees, spendings)
    }
    const chains: Blockchain[] = [cross.source, cross.destination]
    const fees: BaseFeeData[] = []
    const spendings: Spending[] = [new BaseSpending(cross.source, cross.amount, cross.assetId)]
    // exporting jrc20
    let spendingAssetId: string = cross.assetId
    if (cross.source.id === juneChain.id) {
      for (let i = 0; i < juneChain.jrc20Assets.length; i++) {
        const jrc20: JRC20Asset = juneChain.jrc20Assets[i]
        if (jrc20.address === cross.assetId) {
          const sender: string = account.getAccount(juneChain.id).addresses[0]
          const fee: EVMFeeData = await estimateEVMWithdrawJRC20(this.provider.jevm[juneChain.id], sender, jrc20, cross.amount)
          fees.push(fee)
          spendings.push(fee)
          spendingAssetId = jrc20.address
          cross.assetId = jrc20.nativeAssetId
          break
        }
      }
    }
    const exportFee: BaseFeeData = await this.estimateExport(cross.source, cross.destination, cross.assetId)
    const importFee: BaseFeeData = await this.estimateImport(cross.destination, cross.assetId)
    fees.push(exportFee, importFee)
    const sourceAccount: ChainAccount = account.getAccount(cross.source.id)
    const destinationAccount: ChainAccount = account.getAccount(cross.destination.id)
    const destinationBalance: bigint = destinationAccount.getValue(importFee.assetId)
    let sourceBalance: bigint = sourceAccount.getValue(importFee.assetId)
    if (cross.assetId === importFee.assetId) {
      sourceBalance -= cross.amount
    }
    if (exportFee.assetId === importFee.assetId) {
      sourceBalance -= exportFee.amount
    }
    const sendImportFee: boolean = this.shouldSendImportFee(cross.destination, importFee.amount, destinationBalance, sourceBalance)
    cross.sendImportFee = sendImportFee
    spendings.push(exportFee)
    if (sendImportFee) {
      // handle case of crossing jrc20
      const assetId: string = importFee.assetId === cross.assetId
        ? spendingAssetId
        : importFee.assetId
      spendings.push(new BaseSpending(cross.source, importFee.amount, assetId))
    } else {
      spendings.push(importFee)
    }
    return new MCNOperationSummary(cross, chains, fees, spendings)
  }

  async executeCrossOperation (executable: ExecutableMCNOperation, account: MCNAccount): Promise<void> {
    const summary: MCNOperationSummary = executable.summary
    const operation: MCNOperation = summary.operation
    if (operation.type !== MCNOperationType.Cross) {
      throw new CrossError(`operation ${operation.type} is forbidden`)
    }
    const cross: CrossOperation = operation as CrossOperation
    if (this.shouldProxy(cross)) {
      const destination: Blockchain = cross.destination
      cross.destination = this.provider.jvm.chain
      summary.operation = cross // ?? needed in js ?
      await this.executeCrossOperation(executable, account)
      cross.source = this.provider.jvm.chain
      cross.destination = destination
      summary.operation = cross // ?? needed in js ?
      await this.executeCrossOperation(executable, account)
      return
    }
    // exporting jrc20
    if (summary.fees[0].type === FeeType.Withdraw) {
      const juneChain: JEVMBlockchain = SocotraJUNEChain
      const api: JEVMAPI = this.provider.jevm[juneChain.id]
      const juneAccount: EVMAccount = account.getAccount(juneChain.id) as EVMAccount
      const feeData: EVMFeeData = summary.fees[0] as EVMFeeData
      const transactionHash: string = await sendEVMTransaction(api, juneAccount.chainWallet.evmWallet, feeData)
      const success: boolean = await executable.addTrackedEVMTransaction(api, TransactionType.Withdraw, transactionHash)
      if (!success) {
        throw new CrossError(`error during withdraw transaction ${transactionHash} status fetching`)
      }
    }
    const exportFee: FeeData = summary.fees[0]
    const importFee: FeeData = summary.fees[1]
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
    await sourceAccount.fetchAllBalances()
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
      cross.source, cross.destination, cross.assetId, cross.amount, cross.address, !cross.sendImportFee, importFee, destinationUtxos
    )
    let importSuccess: boolean = false
    if (destinationVmId === JVM_ID) {
      importSuccess = await executable.addTrackedJVMTransaction(this.provider.jvm, TransactionType.Import, importTransactionId)
    } else if (destinationVmId === PLATFORMVM_ID) {
      importSuccess = await executable.addTrackedPlatformTransaction(this.provider.platform, TransactionType.Import, importTransactionId)
    } else if (destinationVmId === JEVM_ID) {
      const api: JEVMAPI = this.provider.jevm[destinationAccount.chain.id]
      importSuccess = await executable.addTrackedJEVMTransaction(api, TransactionType.Import, importTransactionId)
    }
    await destinationAccount.fetchAllBalances()
    if (!importSuccess) {
      throw new CrossError(`error during import transaction ${importTransactionId} status fetching`)
    }
    // importing jrc20
    if (summary.fees[summary.fees.length - 1].type === FeeType.Deposit) {
      const juneChain: JEVMBlockchain = SocotraJUNEChain
      const api: JEVMAPI = this.provider.jevm[juneChain.id]
      const juneAccount: EVMAccount = account.getAccount(juneChain.id) as EVMAccount
      const feeData: EVMFeeData = summary.fees[0] as EVMFeeData
      const transactionHash: string = await sendEVMTransaction(api, juneAccount.chainWallet.evmWallet, feeData)
      const success: boolean = await executable.addTrackedEVMTransaction(api, TransactionType.Deposit, transactionHash)
      if (!success) {
        throw new CrossError(`error during deposit transaction ${transactionHash} status fetching`)
      }
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
