import { type AbstractUtxoAPI, type JEVMAPI } from '../api'
import { JVM_ID, PLATFORMVM_ID, JEVM_ID, type Blockchain, SocotraJUNEChain, JEVMBlockchain, type JVMBlockchain, type JRC20Asset } from '../chain'
import { type MCNProvider } from '../juneo'
import { fetchUtxos, type Utxo } from '../transaction'
import { CrossError, getUtxosAmountValues } from '../utils'
import { type EVMAccount, type ChainAccount, type MCNAccount, type UtxoAccount } from './account'
import { type NetworkOperation, NetworkOperationType, type ExecutableOperation, MCNOperationSummary, CrossResumeOperationSummary, NetworkOperationRange, ChainNetworkOperation } from './operation'
import {
  estimateEVMExportTransaction, estimateEVMImportTransaction, estimateJVMExportTransaction, estimateJVMImportTransaction,
  estimatePlatformExportTransaction, estimatePlatformImportTransaction, sendJVMExportTransaction, type FeeData,
  sendPlatformExportTransaction, sendJVMImportTransaction, sendPlatformImportTransaction, sendEVMImportTransaction,
  sendEVMExportTransaction, BaseFeeData, TransactionType, type Spending, BaseSpending, FeeType, type EVMFeeData,
  estimateEVMWithdrawJRC20, sendEVMTransaction, estimateEVMDepositJRC20
} from './transaction'
import { type MCNWallet } from './wallet'

export class CrossManager {
  private readonly provider: MCNProvider
  private readonly wallet: MCNWallet

  constructor (provider: MCNProvider, wallet: MCNWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  async estimateImport (destination: Blockchain, assetId: string, utxosCount?: number, assetsCount?: number): Promise<BaseFeeData> {
    if (destination.vmId === JVM_ID) {
      return await estimateJVMImportTransaction(this.provider)
    } else if (destination.vmId === PLATFORMVM_ID) {
      return await estimatePlatformImportTransaction(this.provider)
    } else if (destination.vmId === JEVM_ID) {
      const api: JEVMAPI = this.provider.jevm[destination.id]
      const exportedAssetsCount: number = assetId === api.chain.assetId ? 1 : 2
      const inputsCount: number = typeof utxosCount === 'number' ? utxosCount : exportedAssetsCount
      // default outputsCount should use 1 instead of exportedAssetsCount but currently needed for importing june for jrc20 deposits
      const outputsCount: number = typeof assetsCount === 'number' ? assetsCount : exportedAssetsCount // 1
      return await estimateEVMImportTransaction(api, inputsCount, outputsCount)
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

  canPayImportFee (destination: Blockchain, importFee: bigint, importFeeAssetDestinationBalance: bigint): boolean {
    return destination.vmId !== JEVM_ID
      ? importFeeAssetDestinationBalance >= importFee
      : false
  }

  shouldSendImportFee (destination: Blockchain, importFee: bigint, importFeeAssetDestinationBalance: bigint, importFeeAssetSourceBalance: bigint): boolean {
    // verify if the destination account can pay the import fee with its funds
    const canPayImportFee: boolean = this.canPayImportFee(destination, importFee, importFeeAssetDestinationBalance)
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
    sendImportFee: boolean = true, importFee?: FeeData, exportFee?: FeeData, utxoSet?: Utxo[], extraFeeAmount: bigint = BigInt(0)
  ): Promise<string> {
    if (source.id === destination.id) {
      throw new CrossError('source and destination chain cannot be the same')
    }
    if (typeof importFee === 'undefined') {
      importFee = await this.estimateImport(destination, assetId)
    }
    if (source.vmId === JVM_ID) {
      return await sendJVMExportTransaction(this.provider, this.wallet, destination, assetId, amount, address, sendImportFee, importFee.amount, exportFee, utxoSet, extraFeeAmount)
    } else if (source.vmId === PLATFORMVM_ID) {
      return await sendPlatformExportTransaction(this.provider, this.wallet, destination, assetId, amount, address, sendImportFee, importFee.amount, exportFee, utxoSet)
    } else if (source.vmId === JEVM_ID) {
      const api: JEVMAPI = this.provider.jevm[source.id]
      return await sendEVMExportTransaction(this.provider, api, this.wallet, destination, assetId, amount, address, sendImportFee, importFee.amount, exportFee)
    }
    throw new CrossError(`source vm id does not support cross: ${source.vmId}`)
  }

  async import (
    source: Blockchain, destination: Blockchain, payImportFee: boolean = false, importFee?: FeeData, utxoSet?: Utxo[]
  ): Promise<string> {
    if (source.id === destination.id) {
      throw new CrossError('source and destination chain cannot be the same')
    }
    if (destination.vmId === JVM_ID) {
      return await sendJVMImportTransaction(this.provider, this.wallet, source, payImportFee, importFee, utxoSet)
    } else if (destination.vmId === PLATFORMVM_ID) {
      return await sendPlatformImportTransaction(this.provider, this.wallet, source, payImportFee, importFee, utxoSet)
    } else if (destination.vmId === JEVM_ID) {
      if (payImportFee) {
        throw new CrossError(`vm id ${destination.vmId} cannot pay import fee`)
      }
      const api: JEVMAPI = this.provider.jevm[destination.id]
      return await sendEVMImportTransaction(this.provider, api, this.wallet, source, importFee, utxoSet)
    }
    throw new CrossError(`destination vm id does not support cross: ${destination.vmId}`)
  }

  async estimateCrossOperation (cross: CrossOperation, account: MCNAccount): Promise<MCNOperationSummary> {
    const juneChain: JEVMBlockchain = SocotraJUNEChain
    if (this.shouldProxy(cross)) {
      const chains: Blockchain[] = [cross.source, this.provider.jvm.chain, cross.destination]
      const proxyExport: CrossOperation = new CrossOperation(cross.source, this.provider.jvm.chain, cross.assetId, cross.amount)
      const exportSummary: MCNOperationSummary = await this.estimateCrossOperation(proxyExport, account)
      const spendings: Spending[] = [...exportSummary.spendings]
      // in proxy will only use the jvm chain to spend fees so do not care about june chain balance eventhough it will require fees
      const jvm: JVMBlockchain = this.provider.jvm.chain
      const proxyImport: CrossOperation = new CrossOperation(this.provider.jvm.chain, cross.destination, cross.assetId, cross.amount)
      const importSummary: MCNOperationSummary = await this.estimateCrossOperation(proxyImport, account)
      importSummary.fees.forEach(fee => {
        const spending: Spending = fee.getAsSpending()
        spending.chain = jvm
        spending.assetId = jvm.assetId
        if (fee.type === FeeType.Deposit) {
          spending.amount /= JEVMBlockchain.AtomicDenomination
        }
        spendings.push(spending)
      })
      const fees: FeeData[] = [...exportSummary.fees, ...importSummary.fees]
      cross.sendImportFee = proxyExport.sendImportFee
      return new MCNOperationSummary(cross, chains, fees, spendings)
    }
    const chains: Blockchain[] = [cross.source, cross.destination]
    const fees: BaseFeeData[] = []
    const spendings: Spending[] = [new BaseSpending(cross.source, cross.amount, cross.assetId)]
    // exporting jrc20
    let spendingAssetId: string = cross.assetId
    let exportedJRC20: JRC20Asset | undefined
    if (cross.source.id === juneChain.id) {
      for (let i = 0; i < juneChain.jrc20Assets.length; i++) {
        const jrc20: JRC20Asset = juneChain.jrc20Assets[i]
        if (jrc20.address === cross.assetId) {
          exportedJRC20 = jrc20
          fees.push(new BaseFeeData(juneChain, BigInt(0), FeeType.Withdraw))
          spendingAssetId = jrc20.address
          cross.assetId = jrc20.nativeAssetId
          break
        }
      }
    }
    let importedJRC20: JRC20Asset | undefined
    if (cross.destination.id === juneChain.id && cross.assetId !== juneChain.assetId) {
      for (let i = 0; i < juneChain.jrc20Assets.length; i++) {
        const jrc20: JRC20Asset = juneChain.jrc20Assets[i]
        if (jrc20.nativeAssetId === cross.assetId) {
          importedJRC20 = jrc20
          break
        }
      }
    }
    const exportFee: BaseFeeData = await this.estimateExport(cross.source, cross.destination, cross.assetId)
    const importFee: BaseFeeData = await this.estimateImport(cross.destination, cross.assetId)
    fees.push(exportFee, importFee)
    if (fees[0].type === FeeType.Withdraw) {
      const sender: string = account.getAccount(juneChain.id).addresses[0]
      const amount: bigint = cross.amount + importFee.amount
      const fee: EVMFeeData = await estimateEVMWithdrawJRC20(this.provider.jevm[juneChain.id], sender, exportedJRC20 as JRC20Asset, amount)
      fees[0] = fee
      spendings.push(fee.getAsSpending())
    }
    if (typeof importedJRC20 !== 'undefined') {
      const sender: string = account.getAccount(juneChain.id).addresses[0]
      // native asset value must be divided by atomic denomination for jrc20 smart contract and shared memory values
      cross.amount /= JEVMBlockchain.AtomicDenomination
      const fee: EVMFeeData = await estimateEVMDepositJRC20(this.provider.jevm[juneChain.id], sender, importedJRC20, cross.amount)
      fees.push(fee)
    }
    const sourceAccount: ChainAccount = account.getAccount(cross.source.id)
    const destinationAccount: ChainAccount = account.getAccount(cross.destination.id)
    const destinationAssetId: string = cross.destination.assetId
    const destinationBalance: bigint = destinationAccount.getValue(destinationAssetId)
    let sourceBalance: bigint = sourceAccount.getValue(destinationAssetId)
    if (cross.assetId === destinationAssetId) {
      sourceBalance -= cross.amount
    }
    if (exportFee.assetId === destinationAssetId) {
      sourceBalance -= exportFee.amount
    }
    const sendImportFee: boolean = this.shouldSendImportFee(cross.destination, importFee.amount, destinationBalance, sourceBalance)
    cross.sendImportFee = sendImportFee
    spendings.push(exportFee.getAsSpending())
    if (sendImportFee) {
      // handle case of crossing jrc20
      const assetId: string = destinationAssetId === cross.assetId
        ? spendingAssetId
        : destinationAssetId
      const amount: bigint = cross.source.id === juneChain.id && destinationAssetId === juneChain.assetId
        ? importFee.amount * JEVMBlockchain.AtomicDenomination
        : importFee.amount
      spendings.push(new BaseSpending(cross.source, amount, assetId))
    } else {
      spendings.push(importFee.getAsSpending())
    }
    return new MCNOperationSummary(cross, chains, fees, spendings)
  }

  async executeCrossOperation (summary: MCNOperationSummary, account: MCNAccount): Promise<void> {
    const operation: NetworkOperation = summary.operation
    if (operation.type !== NetworkOperationType.Cross) {
      throw new CrossError(`operation ${operation.type} is forbidden`)
    }
    const cross: CrossOperation = operation as CrossOperation
    if (this.shouldProxy(cross)) {
      const destination: Blockchain = cross.destination
      const jvmChain: JVMBlockchain = this.provider.jvm.chain
      cross.destination = jvmChain
      await this.executeCrossOperationStep(summary, account, cross, summary.fees[0], summary.fees[1])
      // jevm cross transactions amount must be changed because of atomic denominator
      if (cross.source.vmId === JEVM_ID && cross.assetId === cross.source.assetId) {
        cross.amount /= JEVMBlockchain.AtomicDenomination
      }
      cross.source = jvmChain
      cross.destination = destination
      // always export fee from JVM to destination
      cross.sendImportFee = true
      const lastFee: FeeData = summary.fees[summary.fees.length - 1]
      const jrc20Import: boolean = lastFee.type === FeeType.Deposit
      let extraFeeAmount: bigint = BigInt(0)
      if (jrc20Import) {
        extraFeeAmount = lastFee.amount / JEVMBlockchain.AtomicDenomination
      }
      await this.executeCrossOperationStep(summary, account, cross, summary.fees[2], summary.fees[3], extraFeeAmount)
      return
    }
    let feeIndex: number = summary.fees[0].type === FeeType.Withdraw ? 1 : 0
    await this.executeCrossOperationStep(summary, account, cross, summary.fees[feeIndex++], summary.fees[feeIndex++])
  }

  private async executeCrossOperationStep (
    summary: MCNOperationSummary, account: MCNAccount, cross: CrossOperation, exportFee: FeeData, importFee: FeeData, extraFeeAmount: bigint = BigInt(0)
  ): Promise<void> {
    const executable: ExecutableOperation = summary.getExecutable()
    // exporting jrc20
    if (summary.fees[0].type === FeeType.Withdraw) {
      const juneChain: JEVMBlockchain = SocotraJUNEChain
      const api: JEVMAPI = this.provider.jevm[juneChain.id]
      const juneAccount: EVMAccount = account.getAccount(juneChain.id) as EVMAccount
      const feeData: EVMFeeData = summary.fees[0] as EVMFeeData
      const transactionHash: string = await sendEVMTransaction(api, juneAccount.chainWallet.evmWallet, feeData)
      const success: boolean = await executable.addTrackedEVMTransaction(api, TransactionType.Withdraw, transactionHash)
      await Promise.all([juneAccount.fetchBalance(feeData.assetId), juneAccount.fetchBalance(cross.assetId)])
      if (!success) {
        throw new CrossError(`error during withdraw transaction ${transactionHash} status fetching`)
      }
    }
    let sourceUtxos: Utxo[] = []
    const sourceAccount: ChainAccount = account.getAccount(cross.source.id)
    const sourceVmId: string = sourceAccount.chain.vmId
    if (sourceVmId === JVM_ID || sourceVmId === PLATFORMVM_ID) {
      sourceUtxos = (sourceAccount as UtxoAccount).utxoSet
    }
    const destinationAccount: ChainAccount = account.getAccount(cross.destination.id)
    const exportTransactionId: string = await this.export(
      cross.source, cross.destination, cross.assetId, cross.amount, destinationAccount.addresses[0],
      cross.sendImportFee, importFee, exportFee, sourceUtxos, extraFeeAmount
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
    const destinationUtxos: Utxo[] = await fetchUtxos(
      utxoApi, [destinationAccount.chainWallet.getJuneoAddress()], sourceAccount.chain.id, exportTransactionId
    )
    if (!cross.sendImportFee && (destinationVmId === JVM_ID || destinationVmId === PLATFORMVM_ID)) {
      destinationUtxos.push(...(destinationAccount as UtxoAccount).utxoSet)
    }
    const lastFee: FeeData = summary.fees[summary.fees.length - 1]
    const importTransactionId: string = await this.import(
      cross.source, cross.destination, !cross.sendImportFee, importFee, destinationUtxos
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
    if (lastFee.chain.id === cross.destination.id && lastFee.type === FeeType.Deposit) {
      const juneChain: JEVMBlockchain = SocotraJUNEChain
      const api: JEVMAPI = this.provider.jevm[juneChain.id]
      const juneAccount: EVMAccount = account.getAccount(juneChain.id) as EVMAccount
      const feeData: EVMFeeData = lastFee as EVMFeeData
      const transactionHash: string = await sendEVMTransaction(api, juneAccount.chainWallet.evmWallet, feeData)
      const success: boolean = await executable.addTrackedEVMTransaction(api, TransactionType.Deposit, transactionHash)
      await juneAccount.fetchAllBalances()
      if (!success) {
        throw new CrossError(`error during deposit transaction ${transactionHash} status fetching`)
      }
    }
  }

  async estimateCrossResumeOperation (operation: CrossResumeOperation, account: MCNAccount): Promise<CrossResumeOperationSummary> {
    const vmId: string = operation.destination.vmId
    let utxoApi: AbstractUtxoAPI = this.provider.platform
    if (vmId === JVM_ID) {
      utxoApi = this.provider.jvm
    } else if (vmId === JEVM_ID) {
      utxoApi = this.provider.jevm[operation.destination.id]
    } else if (vmId !== PLATFORMVM_ID) {
      throw new CrossError(`unsupported destination vm id: ${vmId}`)
    }
    const utxos: Utxo[] = operation.utxoSet
    const values: Map<string, bigint> = getUtxosAmountValues(utxos)
    // if we have more than one value it is possible that the fee to pay for import is in the utxos
    // for calculation we will consider it is here to be fully consumed and can remove it from outputs
    const outputsCount: number = values.size > 1 ? values.size - 1 : 1
    let fee: FeeData = await this.estimateImport(operation.destination, operation.destination.assetId, utxos.length, outputsCount)
    let hasFeeValue: boolean = false
    if (values.has(fee.assetId)) {
      const value: bigint = values.get(fee.assetId) as bigint
      hasFeeValue = value >= fee.amount
      // if importing more than one asset and one of those is the fee asset recalculate import with correct outputs count
      if (outputsCount > 1 && value > fee.amount) {
        fee = await this.estimateImport(operation.destination, operation.destination.assetId, utxos.length, values.size)
        // if with the extra output we now do not have enough funds to import set fee amount to value
        // that way it will be fully consumed and it avoids extra costs for one extra output
        if (value < fee.amount) {
          fee.amount = value
        }
      }
    }
    const spendings: Spending[] = []
    let payImportFee: boolean = false
    if (!hasFeeValue) {
      const balance: bigint = account.getAccount(operation.destination.id).getValue(fee.assetId)
      if (this.canPayImportFee(operation.destination, fee.amount, balance)) {
        spendings.push(fee.getAsSpending())
        utxos.push(...await fetchUtxos(utxoApi, [this.wallet.getWallet(operation.destination).getJuneoAddress()]))
        payImportFee = true
      }
    }
    return new CrossResumeOperationSummary(operation, fee, spendings, payImportFee, utxos)
  }

  async fetchUnfinishedCrossOperations (): Promise<CrossResumeOperation[]> {
    const operations: CrossResumeOperation[] = []
    const chains: Blockchain[] = this.provider.mcn.primary.chains
    const promises: Array<Promise<void>> = []
    for (const chain of chains) {
      promises.push(this.fetchUnfinishedChainCrossOperation(chain, operations))
    }
    await Promise.all(promises)
    return operations
  }

  private async fetchUnfinishedChainCrossOperation (chain: Blockchain, list: CrossResumeOperation[]): Promise<void> {
    const vmId: string = chain.vmId
    let utxoApi: AbstractUtxoAPI = this.provider.platform
    if (vmId === JVM_ID) {
      utxoApi = this.provider.jvm
    } else if (vmId === JEVM_ID) {
      utxoApi = this.provider.jevm[chain.id]
    } else if (vmId !== PLATFORMVM_ID) {
      throw new CrossError(`unsupported vm id: ${vmId}`)
    }
    const chains: Blockchain[] = this.provider.mcn.primary.chains
    for (const source of chains) {
      if (source.id === chain.id) {
        continue
      }
      const utxoSet: Utxo[] = await fetchUtxos(utxoApi, [this.wallet.getWallet(chain).getJuneoAddress()], source.id)
      if (utxoSet.length > 0) {
        list.push(new CrossResumeOperation(source, chain, utxoSet))
      }
    }
  }
}

export class CrossOperation implements NetworkOperation {
  type: NetworkOperationType = NetworkOperationType.Cross
  range: NetworkOperationRange = NetworkOperationRange.Supernet
  source: Blockchain
  destination: Blockchain
  assetId: string
  amount: bigint
  sendImportFee: boolean = true

  constructor (source: Blockchain, destination: Blockchain, assetId: string, amount: bigint) {
    this.source = source
    this.destination = destination
    this.assetId = assetId
    this.amount = amount
  }
}

export class CrossResumeOperation extends ChainNetworkOperation {
  source: Blockchain
  destination: Blockchain
  utxoSet: Utxo[]

  constructor (source: Blockchain, destination: Blockchain, utxoSet: Utxo[]) {
    super(NetworkOperationType.CrossResume, destination)
    this.source = source
    this.destination = destination
    this.utxoSet = utxoSet
  }
}
