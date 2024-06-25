import {
  BaseFeeData,
  BaseSpending,
  estimateEVMDepositJRC20,
  estimateEVMExportTransaction,
  estimateEVMImportTransaction,
  estimateEVMWithdrawJRC20,
  estimateJVMExportTransaction,
  estimateJVMImportTransaction,
  estimatePlatformExportTransaction,
  estimatePlatformImportTransaction,
  executeEVMExportTransaction,
  executeEVMImportTransaction,
  executeEVMTransaction,
  executeJVMExportTransaction,
  executeJVMImportTransaction,
  executePlatformExportTransaction,
  executePlatformImportTransaction,
  FeeType,
  TransactionType,
  type EVMFeeData,
  type FeeData,
  type Spending
} from '..'
import { type AbstractUtxoAPI, type JEVMAPI } from '../../../api'
import { type JRC20Asset } from '../../../asset'
import {
  JEVM_ID,
  JVM_ID,
  PLATFORMVM_ID,
  type Blockchain,
  type JEVMBlockchain,
  type JVMBlockchain
} from '../../../chain'
import { type MCNProvider } from '../../../juneo'
import { type Secp256k1Output, type Utxo } from '../../../transaction'
import {
  AtomicDenomination,
  CrossError,
  fetchUtxos,
  getUtxoAPI,
  getUtxosAmountValues,
  TimeUtils,
  trackJuneoTransaction
} from '../../../utils'
import { type ChainAccount, type EVMAccount, type MCNAccount, type UtxoAccount } from '../../account'
import {
  CrossOperation,
  CrossOperationSummary,
  CrossResumeOperation,
  CrossResumeOperationSummary,
  DepositResumeOperation,
  DepositResumeOperationSummary,
  type ExecutableOperation
} from '../../operation'
import { type MCNWallet } from '../../wallet'

export class CrossManager {
  private readonly provider: MCNProvider
  private readonly wallet: MCNWallet

  constructor (provider: MCNProvider, wallet: MCNWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  async estimateImport (
    provider: MCNProvider,
    destination: Blockchain,
    assetId: string,
    utxosCount?: number,
    assetsCount?: number
  ): Promise<BaseFeeData> {
    if (destination.vm.id === JVM_ID) {
      return await estimateJVMImportTransaction(provider)
    } else if (destination.vm.id === PLATFORMVM_ID) {
      return await estimatePlatformImportTransaction(provider)
    } else if (destination.vm.id === JEVM_ID) {
      const api: JEVMAPI = provider.jevmApi[destination.id]
      const exportedAssetsCount: number = assetId === api.chain.assetId ? 1 : 2
      const inputsCount: number = typeof utxosCount === 'number' ? utxosCount : exportedAssetsCount
      // default outputsCount should use 1 instead of exportedAssetsCount but currently needed for importing june for jrc20 deposits
      const outputsCount: number = typeof assetsCount === 'number' ? assetsCount : exportedAssetsCount // 1
      return await estimateEVMImportTransaction(api, inputsCount, outputsCount)
    }
    throw new CrossError(`destination vm id does not support cross: ${destination.vm.id}`)
  }

  async estimateExport (
    provider: MCNProvider,
    source: Blockchain,
    destination: Blockchain,
    assetId: string
  ): Promise<BaseFeeData> {
    if (source.vm.id === JVM_ID) {
      return await estimateJVMExportTransaction(provider)
    } else if (source.vm.id === PLATFORMVM_ID) {
      return await estimatePlatformExportTransaction(provider)
    } else if (source.vm.id === JEVM_ID) {
      const api: JEVMAPI = provider.jevmApi[source.id]
      return await estimateEVMExportTransaction(api, assetId, destination)
    }
    throw new CrossError(`source vm id does not support cross: ${source.vm.id}`)
  }

  canPayImportFee (destination: Blockchain, importFee: bigint, importFeeAssetDestinationBalance: bigint): boolean {
    return destination.vm.id !== JEVM_ID ? importFeeAssetDestinationBalance >= importFee : false
  }

  shouldSendImportFee (
    destination: Blockchain,
    importFee: bigint,
    importFeeAssetDestinationBalance: bigint,
    importFeeAssetSourceBalance: bigint
  ): boolean {
    // verify if the destination account can pay the import fee with its funds
    const canPayImportFee: boolean = this.canPayImportFee(destination, importFee, importFeeAssetDestinationBalance)
    // will not export the import fee only if destination can pay
    // import fee and source does not have enough to export it
    const sendImportFee: boolean = canPayImportFee ? importFeeAssetSourceBalance >= importFee : true
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
    return (
      cross.source.vm.id === JEVM_ID &&
      cross.destination.vm.id === JEVM_ID &&
      cross.source.id !== this.provider.juneChain.id
    )
  }

  async export (
    provider: MCNProvider,
    source: Blockchain,
    destination: Blockchain,
    assetId: string,
    amount: bigint,
    address: string,
    sendImportFee: boolean = true,
    importFee: FeeData,
    exportFee: FeeData,
    utxoSet: Utxo[],
    extraFeeAmount: bigint = BigInt(0)
  ): Promise<string> {
    if (source.id === destination.id) {
      throw new CrossError('source and destination chain cannot be the same')
    }
    if (source.vm.id === JVM_ID) {
      return await executeJVMExportTransaction(
        provider,
        this.wallet,
        destination,
        assetId,
        amount,
        address,
        sendImportFee,
        importFee.amount,
        exportFee,
        utxoSet,
        extraFeeAmount
      )
    } else if (source.vm.id === PLATFORMVM_ID) {
      return await executePlatformExportTransaction(
        provider,
        this.wallet,
        destination,
        assetId,
        amount,
        address,
        sendImportFee,
        importFee.amount,
        exportFee,
        utxoSet
      )
    } else if (source.vm.id === JEVM_ID) {
      const api: JEVMAPI = provider.jevmApi[source.id]
      return await executeEVMExportTransaction(
        provider,
        api,
        this.wallet,
        destination,
        assetId,
        amount,
        address,
        sendImportFee,
        importFee.amount,
        exportFee
      )
    }
    throw new CrossError(`source vm id does not support cross: ${source.vm.id}`)
  }

  async import (
    provider: MCNProvider,
    source: Blockchain,
    destination: Blockchain,
    payImportFee: boolean = false,
    importFee: FeeData,
    utxoSet: Utxo[]
  ): Promise<string> {
    if (source.id === destination.id) {
      throw new CrossError('source and destination chain cannot be the same')
    }
    if (destination.vm.id === JVM_ID) {
      return await executeJVMImportTransaction(provider, this.wallet, source, importFee, utxoSet)
    } else if (destination.vm.id === PLATFORMVM_ID) {
      return await executePlatformImportTransaction(provider, this.wallet, source, importFee, utxoSet)
    } else if (destination.vm.id === JEVM_ID) {
      if (payImportFee) {
        throw new CrossError(`vm id ${destination.vm.id} cannot pay import fee`)
      }
      const api: JEVMAPI = provider.jevmApi[destination.id]
      return await executeEVMImportTransaction(provider, api, this.wallet, source, importFee, utxoSet)
    }
    throw new CrossError(`destination vm id does not support cross: ${destination.vm.id}`)
  }

  async estimateCrossOperation (cross: CrossOperation, account: MCNAccount): Promise<CrossOperationSummary> {
    const provider: MCNProvider = await this.provider.getStaticProvider()
    const juneChain: JEVMBlockchain = provider.juneChain
    const values = new Map<string, bigint>([[cross.assetId, cross.amount]])
    if (this.shouldProxy(cross)) {
      const chains: Blockchain[] = [cross.source, provider.jvmChain, cross.destination]
      const proxyExport: CrossOperation = new CrossOperation(
        cross.source,
        provider.jvmChain,
        cross.assetId,
        cross.amount
      )
      const exportSummary: CrossOperationSummary = await this.estimateCrossOperation(proxyExport, account)
      const spendings: Spending[] = [...exportSummary.spendings]
      // in proxy will only use the jvm chain to spend fees so do not care about june chain balance eventhough it will require fees
      const jvm: JVMBlockchain = provider.jvmChain
      const proxyImport: CrossOperation = new CrossOperation(
        provider.jvmChain,
        cross.destination,
        cross.assetId,
        cross.amount
      )
      const importSummary: CrossOperationSummary = await this.estimateCrossOperation(proxyImport, account)
      importSummary.fees.forEach((fee) => {
        const spending: Spending = fee.spending
        spending.chain = jvm
        spending.assetId = jvm.assetId
        if (fee.type === FeeType.Deposit) {
          spending.amount /= AtomicDenomination
        }
        spendings.push(spending)
      })
      const fees: FeeData[] = [...exportSummary.fees, ...importSummary.fees]
      cross.sendImportFee = proxyExport.sendImportFee
      return new CrossOperationSummary(provider, cross, chains, fees, spendings, values)
    }
    const chains: Blockchain[] = [cross.source, cross.destination]
    const fees: BaseFeeData[] = []
    const spendings: Spending[] = [new BaseSpending(cross.source, cross.amount, cross.assetId)]
    // exporting jrc20
    let spendingAssetId: string = cross.assetId
    let exportedJRC20: JRC20Asset | undefined
    if (cross.source.id === juneChain.id) {
      for (const jrc20 of juneChain.jrc20Assets) {
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
      for (const jrc20 of juneChain.jrc20Assets) {
        if (jrc20.nativeAssetId === cross.assetId) {
          importedJRC20 = jrc20
          break
        }
      }
    }
    const exportFee: BaseFeeData = await this.estimateExport(provider, cross.source, cross.destination, cross.assetId)
    const importFee: BaseFeeData = await this.estimateImport(provider, cross.destination, cross.assetId)
    fees.push(exportFee, importFee)
    if (fees[0].type === FeeType.Withdraw) {
      const sender: string = account.getAccount(juneChain.id).address
      const amount: bigint = cross.amount + importFee.amount
      const fee: EVMFeeData = await estimateEVMWithdrawJRC20(
        provider.jevmApi[juneChain.id],
        sender,
        exportedJRC20!,
        amount
      )
      fees[0] = fee
      spendings.push(fee.spending)
    }
    if (typeof importedJRC20 !== 'undefined') {
      const sender: string = account.getAccount(juneChain.id).address
      // native asset value must be divided by atomic denomination for jrc20 smart contract and shared memory values
      cross.amount /= AtomicDenomination
      const fee: EVMFeeData = await estimateEVMDepositJRC20(
        provider.jevmApi[juneChain.id],
        sender,
        importedJRC20,
        cross.amount
      )
      fees.push(fee)
    }
    const sourceAccount: ChainAccount = account.getAccount(cross.source.id)
    const destinationAccount: ChainAccount = account.getAccount(cross.destination.id)
    const destinationAssetId: string = cross.destination.assetId
    const destinationBalance: bigint = destinationAccount.getAmount(destinationAssetId)
    let sourceBalance: bigint = sourceAccount.getAmount(destinationAssetId)
    if (cross.assetId === destinationAssetId) {
      sourceBalance -= cross.amount
    }
    if (exportFee.assetId === destinationAssetId) {
      sourceBalance -= exportFee.amount
    }
    const sendImportFee: boolean = this.shouldSendImportFee(
      cross.destination,
      importFee.amount,
      destinationBalance,
      sourceBalance
    )
    cross.sendImportFee = sendImportFee
    spendings.push(exportFee.spending)
    if (sendImportFee) {
      // handle case of crossing jrc20
      const assetId: string = destinationAssetId === cross.assetId ? spendingAssetId : destinationAssetId
      const amount: bigint =
        cross.source.id === juneChain.id && destinationAssetId === juneChain.assetId
          ? importFee.amount * AtomicDenomination
          : importFee.amount
      spendings.push(new BaseSpending(cross.source, amount, assetId))
    } else {
      spendings.push(importFee.spending)
    }
    return new CrossOperationSummary(provider, cross, chains, fees, spendings, values)
  }

  async executeCrossOperation (summary: CrossOperationSummary, account: MCNAccount): Promise<void> {
    const cross: CrossOperation = summary.operation
    if (this.shouldProxy(cross)) {
      const destination: Blockchain = cross.destination
      const jvmChain: JVMBlockchain = this.provider.jvmChain
      cross.destination = jvmChain
      await this.executeCrossOperationStep(summary, account, cross, summary.fees[0], summary.fees[1])
      // jevm cross transactions amount must be changed because of atomic denominator
      if (cross.source.vm.id === JEVM_ID && cross.assetId === cross.source.assetId) {
        cross.amount /= AtomicDenomination
      }
      cross.source = jvmChain
      cross.destination = destination
      // always export fee from JVM to destination
      cross.sendImportFee = true
      const lastFee: FeeData = summary.fees[summary.fees.length - 1]
      const jrc20Import: boolean = lastFee.type === FeeType.Deposit
      let extraFeeAmount: bigint = BigInt(0)
      if (jrc20Import) {
        extraFeeAmount = lastFee.amount / AtomicDenomination
      }
      await this.executeCrossOperationStep(summary, account, cross, summary.fees[2], summary.fees[3], extraFeeAmount)
      return
    }
    let feeIndex: number = summary.fees[0].type === FeeType.Withdraw ? 1 : 0
    await this.executeCrossOperationStep(summary, account, cross, summary.fees[feeIndex++], summary.fees[feeIndex++])
  }

  private async executeCrossOperationStep (
    summary: CrossOperationSummary,
    account: MCNAccount,
    cross: CrossOperation,
    exportFee: FeeData,
    importFee: FeeData,
    extraFeeAmount: bigint = BigInt(0)
  ): Promise<void> {
    const executable: ExecutableOperation = summary.getExecutable()
    const provider: MCNProvider = executable.provider
    // exporting jrc20
    if (summary.fees[0].type === FeeType.Withdraw) {
      const juneChain: JEVMBlockchain = provider.juneChain
      const juneAccount: EVMAccount = account.getAccount(juneChain.id) as EVMAccount
      const feeData: EVMFeeData = summary.fees[0] as EVMFeeData
      const transactionHash: string = await executeEVMTransaction(provider, juneAccount.chainWallet, feeData)
      const success: boolean = await executable.trackEVMTransaction(
        juneChain.id,
        transactionHash,
        TransactionType.Withdraw
      )
      if (!success) {
        const status: string = executable.receipts[executable.receipts.length - 1].transactionStatus
        throw new CrossError(`error during withdraw transaction ${transactionHash} status fetching: ${status}`)
      }
      // wait until withdraw utxos are generated (should be max block time)
      // it may be better to do checks of existence of such utxos instead of assuming they exist after waiting
      await TimeUtils.sleep(2000)
      // feeData.data.to is the jrc20 address for withdraw transactions
      // cross.assetId should be jrc20.nativeAssetId here
      await juneAccount.fetchBalances([cross.assetId, feeData.data.to, feeData.assetId])
    }
    const balancesSync: Array<Promise<void>> = []
    let sourceUtxos: Utxo[] = []
    const sourceAccount: ChainAccount = account.getAccount(cross.source.id)
    if (cross.source.vm.id === JVM_ID || cross.source.vm.id === PLATFORMVM_ID) {
      sourceUtxos = (sourceAccount as UtxoAccount).utxoSet
    }
    const destinationAccount: ChainAccount = account.getAccount(cross.destination.id)
    const exportTransactionId: string = await this.export(
      provider,
      cross.source,
      cross.destination,
      cross.assetId,
      cross.amount,
      destinationAccount.address,
      cross.sendImportFee,
      importFee,
      exportFee,
      sourceUtxos,
      extraFeeAmount
    )
    const exportSuccess: boolean = await trackJuneoTransaction(
      cross.source,
      executable,
      exportTransactionId,
      TransactionType.Export
    )
    if (!exportSuccess) {
      const status: string = executable.receipts[executable.receipts.length - 1].transactionStatus
      throw new CrossError(`error during export transaction ${exportTransactionId} status fetching: ${status}`)
    }
    // wait until export utxos are generated (should be max block time)
    // it may be better to do checks of existence of such utxos instead of assuming they exist after waiting
    await TimeUtils.sleep(2000)
    const exportTransactionAssets: string[] = [cross.assetId]
    if (cross.assetId !== exportFee.assetId) {
      exportTransactionAssets.push(exportFee.assetId)
    }
    if (cross.sendImportFee && exportFee.assetId !== importFee.assetId && cross.assetId !== importFee.assetId) {
      exportTransactionAssets.push(importFee.assetId)
    }
    balancesSync.push(sourceAccount.fetchBalances(exportTransactionAssets))
    const utxoApi: AbstractUtxoAPI = getUtxoAPI(provider, cross.destination)
    // fetch imported utxos
    const destinationUtxos: Utxo[] = await fetchUtxos(
      utxoApi,
      [destinationAccount.chainWallet.getJuneoAddress()],
      cross.source.id,
      exportTransactionId
    )
    const destinationVmId: string = cross.destination.vm.id
    if (!cross.sendImportFee && (destinationVmId === JVM_ID || destinationVmId === PLATFORMVM_ID)) {
      destinationUtxos.push(...(destinationAccount as UtxoAccount).utxoSet)
    }
    const importTransactionId: string = await this.import(
      provider,
      cross.source,
      cross.destination,
      !cross.sendImportFee,
      importFee,
      destinationUtxos
    )
    const importSuccess: boolean = await trackJuneoTransaction(
      cross.destination,
      executable,
      importTransactionId,
      TransactionType.Import
    )
    if (!importSuccess) {
      const status: string = executable.receipts[executable.receipts.length - 1].transactionStatus
      throw new CrossError(`error during import transaction ${importTransactionId} status fetching: ${status}`)
    }
    // importing jrc20
    const lastFee: FeeData = summary.fees[summary.fees.length - 1]
    const deposit: boolean = lastFee.chain.id === cross.destination.id && lastFee.type === FeeType.Deposit
    const importTransactionAssets: string[] = [cross.assetId]
    if (cross.assetId !== importFee.assetId) {
      importTransactionAssets.push(importFee.assetId)
    }
    if (deposit) {
      await destinationAccount.fetchBalances(importTransactionAssets)
      const juneChain: JEVMBlockchain = provider.juneChain
      const juneAccount: EVMAccount = account.getAccount(juneChain.id) as EVMAccount
      const feeData: EVMFeeData = lastFee as EVMFeeData
      const transactionHash: string = await executeEVMTransaction(provider, juneAccount.chainWallet, feeData)
      const success: boolean = await executable.trackEVMTransaction(
        juneChain.id,
        transactionHash,
        TransactionType.Deposit
      )
      if (!success) {
        const status: string = executable.receipts[executable.receipts.length - 1].transactionStatus
        throw new CrossError(`error during deposit transaction ${transactionHash} status fetching: ${status}`)
      }
      // JUNE cannot be jrc20 on the JUNE-Chain so always use fee assetId
      const depositAssets: string[] = [cross.assetId, feeData.assetId]
      let jrc20: JRC20Asset | undefined
      for (const asset of juneChain.jrc20Assets) {
        if (asset.nativeAssetId === cross.assetId) {
          jrc20 = asset
          break
        }
      }
      // should always be true sanity check
      if (typeof jrc20 !== 'undefined') {
        depositAssets.push(jrc20.address)
      }
      balancesSync.push(juneAccount.fetchBalances(depositAssets))
    } else {
      balancesSync.push(destinationAccount.fetchBalances(importTransactionAssets))
    }
    // wait for all balances to be synced before returning
    await Promise.all(balancesSync)
  }

  async estimateDepositResumeOperation (operation: DepositResumeOperation): Promise<DepositResumeOperationSummary> {
    const provider: MCNProvider = await this.provider.getStaticProvider()
    const sender: string = this.wallet.getAddress(operation.chain)
    const fee: EVMFeeData = await estimateEVMDepositJRC20(
      provider.jevmApi[operation.chain.id],
      sender,
      operation.asset,
      operation.amount
    )
    return new DepositResumeOperationSummary(
      provider,
      operation,
      fee,
      [fee.spending],
      new Map<string, bigint>([[operation.asset.address, operation.amount]])
    )
  }

  async estimateCrossResumeOperation (
    operation: CrossResumeOperation,
    account: MCNAccount
  ): Promise<CrossResumeOperationSummary> {
    const provider: MCNProvider = await this.provider.getStaticProvider()
    const utxoApi: AbstractUtxoAPI = getUtxoAPI(provider, operation.destination)
    const utxos: Utxo[] = operation.utxoSet
    const values: Map<string, bigint> = getUtxosAmountValues(utxos, operation.source.id)
    // if we have more than one value it is possible that the fee to pay for import is in the utxos
    // for calculation we will consider it is here to be fully consumed and can remove it from outputs
    const outputsCount: number = values.size > 1 ? values.size - 1 : 1
    let fee: FeeData = await this.estimateImport(
      provider,
      operation.destination,
      operation.destination.assetId,
      utxos.length,
      outputsCount
    )
    let hasFeeValue: boolean = false
    if (values.has(fee.assetId)) {
      const value: bigint = values.get(fee.assetId)!
      hasFeeValue = value >= fee.amount
      // if importing more than one asset and one of those is the fee asset recalculate import with correct outputs count
      if (outputsCount > 1 && value > fee.amount) {
        fee = await this.estimateImport(
          provider,
          operation.destination,
          operation.destination.assetId,
          utxos.length,
          values.size
        )
        // if with the extra output we now do not have enough funds to import set fee amount to value
        // that way it will be fully consumed and it avoids extra costs for one extra output
        if (value < fee.amount) {
          fee.amount = value
        }
      }
    }
    const spendings: Spending[] = []
    let payImportFee: boolean = false
    const summaryUtxos: Utxo[] = [...utxos]
    if (!hasFeeValue) {
      const balance: bigint = account.getAccount(operation.destination.id).getAmount(fee.assetId)
      if (this.canPayImportFee(operation.destination, fee.amount, balance)) {
        spendings.push(fee.spending)
        summaryUtxos.push(
          ...(await fetchUtxos(utxoApi, [this.wallet.getWallet(operation.destination).getJuneoAddress()]))
        )
        payImportFee = true
      }
    }
    if (hasFeeValue && !payImportFee) {
      const value: bigint = values.get(fee.assetId)!
      values.set(fee.assetId, value - fee.amount)
    }
    return new CrossResumeOperationSummary(provider, operation, fee, spendings, values, payImportFee, summaryUtxos)
  }

  async fetchUnfinishedDepositOperations (): Promise<DepositResumeOperation[]> {
    const operations: DepositResumeOperation[] = []
    const promises: Array<Promise<void>> = []
    const chain: JEVMBlockchain = this.provider.juneChain
    for (const jrc20 of chain.jrc20Assets) {
      promises.push(this.fetchUnfinishedJRC20DepositOperation(chain, jrc20, operations))
    }
    await Promise.all(promises)
    return operations
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

  private async fetchUnfinishedJRC20DepositOperation (
    chain: JEVMBlockchain,
    jrc20: JRC20Asset,
    list: DepositResumeOperation[]
  ): Promise<void> {
    const api: JEVMAPI = this.provider.jevmApi[chain.id]
    const address: string = this.wallet.getAddress(chain)
    const balance: bigint = await api.eth_getAssetBalance(address, 'latest', jrc20.nativeAssetId)
    if (balance > BigInt(0)) {
      list.push(new DepositResumeOperation(chain, jrc20, balance))
    }
  }

  private async fetchUnfinishedChainCrossOperation (chain: Blockchain, list: CrossResumeOperation[]): Promise<void> {
    const utxoApi: AbstractUtxoAPI = getUtxoAPI(this.provider, chain)
    const chains: Blockchain[] = this.provider.mcn.primary.chains
    for (const source of chains) {
      if (source.id === chain.id) {
        continue
      }
      const utxoSet: Utxo[] = await fetchUtxos(utxoApi, [this.wallet.getWallet(chain).getJuneoAddress()], source.id)
      // in case we are importing the fee asset make sure it will be worth it to import it
      if (utxoSet.length === 1 && utxoSet[0].assetId.assetId === chain.assetId) {
        const fee: FeeData = await this.estimateImport(this.provider, chain, chain.assetId, 1, 1)
        // if is fee asset cannot be another output type than this
        const amount: bigint = (utxoSet[0].output as Secp256k1Output).amount
        // in that case we would only lose value so skip this utxoSet
        if (amount <= fee.amount) {
          continue
        }
      }
      if (utxoSet.length > 0) {
        list.push(new CrossResumeOperation(source, chain, utxoSet))
      }
    }
  }

  async executeDepositResumeOperation (summary: DepositResumeOperationSummary, account: EVMAccount): Promise<void> {
    const operation: DepositResumeOperation = summary.operation
    const fee: EVMFeeData = summary.fee
    const executable: ExecutableOperation = summary.getExecutable()
    const transactionHash: string = await executeEVMTransaction(executable.provider, account.chainWallet, fee)
    const success: boolean = await executable.trackEVMTransaction(
      operation.chain.id,
      transactionHash,
      TransactionType.Deposit
    )
    if (!success) {
      const status: string = executable.receipts[executable.receipts.length - 1].transactionStatus
      throw new CrossError(`error during deposit resume transaction ${transactionHash} status fetching: ${status}`)
    }
    const jrc20: JRC20Asset = operation.asset
    await account.fetchBalances([fee.assetId, jrc20.nativeAssetId, jrc20.address])
  }

  async executeCrossResumeOperation (summary: CrossResumeOperationSummary, account: ChainAccount): Promise<void> {
    const resumeOperation: CrossResumeOperation = summary.operation
    const executable: ExecutableOperation = summary.getExecutable()
    const importTransactionId: string = await this.import(
      executable.provider,
      resumeOperation.source,
      resumeOperation.destination,
      summary.payImportFee,
      summary.importFee,
      summary.utxoSet
    )
    const importSuccess: boolean = await trackJuneoTransaction(
      resumeOperation.destination,
      executable,
      importTransactionId,
      TransactionType.Import
    )
    if (!importSuccess) {
      const status: string = executable.receipts[executable.receipts.length - 1].transactionStatus
      throw new CrossError(`error during cross resume transaction ${importTransactionId} status fetching: ${status}`)
    }
    const promises: Array<Promise<void>> = [account.fetchBalances(summary.values.keys())]
    if (!summary.values.has(summary.importFee.assetId)) {
      promises.push(account.fetchBalance(summary.importFee.assetId))
    }
    await Promise.all(promises)
  }
}
