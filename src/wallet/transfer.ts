import {
  type Blockchain, JVM_ID, isCrossable, type Crossable, PLATFORMVM_ID, type JVMBlockchain,
  type PlatformBlockchain, JEVM_ID, JEVMBlockchain, NativeAssetCallContract, type JRC20Asset
} from '../chain'
import { type MCNProvider } from '../juneo'
import {
  JVMTransactionStatus, JVMTransactionStatusFetcher, UserInput, type Utxo, PlatformTransactionStatusFetcher, PlatformTransactionStatus, fetchUtxos
} from '../transaction'
import { TransferError } from '../utils'
import { type JEVMWallet, type JuneoWallet, type VMWallet } from './wallet'
import * as jvm from '../transaction/jvm'
import * as jevm from '../transaction/jevm'
import * as platform from '../transaction/platform'
import { type JEVMAPI } from '../api/jevm'
import { EVMTransactionStatus, EVMTransactionStatusFetcher, JEVMTransactionStatus, JEVMTransactionStatusFetcher } from '../transaction/jevm'
import { type TransactionRequest } from 'ethers'
import { type ContractAdapter, JRC20ContractAdapter } from '../solidity'
import { JVMAccount, PlatformAccount } from './account'
import { TransactionReceipt, TransactionType, WalletStatusFetcherTimeout, type FeeData, calculateFee } from './transaction'

export enum TransferStatus {
  Initializing = 'Initializing',
  Sending = 'Sending',
  Done = 'Done',
  Timeout = 'Timeout',
  Error = 'Error'
}

export enum TransferType {
  Base = 'Base transfer',
  Cross = 'Cross chain transfer',
  Bridge = 'Bridge transfer'
}

export class TransferManager {
  private readonly provider: MCNProvider
  private readonly wallet: JuneoWallet

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  async calculate (userInputs: UserInput[]): Promise<TransferSummary[]> {
    const transfersInputs: Array<Record<string, UserInput[]>> = this.sortInputs(userInputs)
    const intraTransfersInputs: Record<string, UserInput[]> = transfersInputs[0]
    const interTransfersInputs: Record<string, UserInput[]> = transfersInputs[1]
    const summaries: TransferSummary[] = []
    for (const key in intraTransfersInputs) {
      const inputs: UserInput[] = intraTransfersInputs[key]
      const source: Blockchain = inputs[0].sourceChain
      const fee: FeeData[] = await calculateFee(this.provider, this.wallet, source, source, inputs)
      summaries.push(new TransferSummary(TransferType.Base, inputs, source, fee))
    }
    for (const key in interTransfersInputs) {
      const inputs: UserInput[] = interTransfersInputs[key]
      // because of previously sorting should always be safe casting here
      const source: Blockchain & Crossable = inputs[0].sourceChain as unknown as Blockchain & Crossable
      const destination: Blockchain & Crossable = inputs[0].destinationChain as unknown as Blockchain & Crossable
      const fee: FeeData[] = await calculateFee(this.provider, this.wallet, source, destination, inputs)
      summaries.push(new TransferSummary(TransferType.Cross, inputs, source, fee))
    }
    return summaries
  }

  transfer (userInputs: UserInput[]): TransferHandler[] {
    const transfersInputs: Array<Record<string, UserInput[]>> = this.sortInputs(userInputs)
    const interTransfersInputs: Record<string, UserInput[]> = transfersInputs[1]
    const handlers: ExecutableTransferHandler[] = []
    for (const key in interTransfersInputs) {
      const inputs: UserInput[] = interTransfersInputs[key]
      const interTransfer: Transfer = new Transfer(
        inputs[0].sourceChain, inputs[0].destinationChain, inputs, this.wallet
      )
      handlers.push(new InterChainTransferHandler(interTransfer))
    }
    // we cannot do parallel transfers because they all have the same source chain
    // and if they use utxos we must wait before one transaction is done to be more
    // easily able to calculate which utxo to use for the others
    // if we want to parallelize this process it would require some rework on how
    // the utxos are fetched during transaction building but still
    // this may remain impossible in some cases (e.g. address with low utxo count)
    void this.executeHandlers(handlers)
    return handlers
  }

  private async executeHandlers (handlers: ExecutableTransferHandler[]): Promise<void> {
    for (let i: number = 0; i < handlers.length; i++) {
      await handlers[i].execute(this.provider)
    }
  }

  private sortInputs (userInputs: UserInput[]): Array<Record<string, UserInput[]>> {
    if (userInputs.length < 1) {
      throw new TransferError('user inputs cannot be empty')
    }
    const intraTransfersInputs: Record<string, UserInput[]> = {}
    const interTransfersInputs: Record<string, UserInput[]> = {}
    // for chains that do not support transaction batching
    // we can still do parallel transactions to simulate it
    // do not forget to isolate user inputs again to execute it
    // note that fee cost will be higher for non batched transactions
    userInputs.forEach(input => {
      if (input.amount < BigInt(1)) {
        throw new TransferError('input amount must be greater than 0')
      }
      if (!input.destinationChain.validateAddress(input.address, this.provider.mcn.hrp)) {
        throw new TransferError(`invalid input address for destination chain: ${input.address}`)
      }
      const sourceId: string = input.sourceChain.id
      // inter chain transfer case
      if (sourceId !== input.destinationChain.id) {
        // for now only crossable compatible chains can do inter chain transfers
        if (!isCrossable(input.sourceChain) || !isCrossable(input.destinationChain)) {
          throw new TransferError('both chains must implement Crossable to do inter chain transfer')
        }
        const key: string = sourceId + input.destinationChain.id
        if (interTransfersInputs[key] === undefined) {
          interTransfersInputs[key] = [input]
        } else {
          interTransfersInputs[key].push(input)
        }
      // intra chain transfer case
      } else {
        if (intraTransfersInputs[sourceId] === undefined) {
          intraTransfersInputs[sourceId] = [input]
        } else {
          intraTransfersInputs[sourceId].push(input)
        }
      }
    })
    return [intraTransfersInputs, interTransfersInputs]
  }
}

export class TransferSummary {
  type: string
  sortedInputs: UserInput[]
  sourceChain: Blockchain
  fees: FeeData[]

  constructor (type: string, sortedInputs: UserInput[], sourceChain: Blockchain, fees: FeeData[]) {
    this.type = type
    this.sortedInputs = sortedInputs
    this.sourceChain = sourceChain
    this.fees = fees
  }
}

export class Transfer {
  sourceChain: Blockchain
  destinationChain: Blockchain
  userInputs: UserInput[]
  signer: JuneoWallet

  constructor (sourceChain: Blockchain, destinationChain: Blockchain, userInputs: UserInput[], signer: JuneoWallet) {
    this.sourceChain = sourceChain
    this.destinationChain = destinationChain
    this.userInputs = userInputs
    this.signer = signer
  }
}

export interface TransferHandler {
  getStatus: () => string

  getTransfer: () => Transfer | undefined

  getCurrentReceipts: () => TransactionReceipt[]
}

interface ExecutableTransferHandler extends TransferHandler {
  execute: (provider: MCNProvider) => Promise<void>
}

class InterChainTransferHandler implements ExecutableTransferHandler {
  private status: string = TransferStatus.Initializing
  private readonly transfer: Transfer
  private readonly receipts: TransactionReceipt[] = []

  constructor (transfer: Transfer) {
    this.transfer = transfer
  }

  getStatus (): string {
    return this.status
  }

  getTransfer (): Transfer | undefined {
    return this.transfer
  }

  getCurrentReceipts (): TransactionReceipt[] {
    return this.receipts
  }

  async execute (provider: MCNProvider): Promise<void> {
    if (this.transfer.sourceChain.vmId === JVM_ID) {
      await this.executeJVMTransfer(provider, this.transfer)
    } else if (this.transfer.sourceChain.vmId === PLATFORMVM_ID) {
      await this.executePlatformTransfer(provider, this.transfer)
    } else if (this.transfer.sourceChain.vmId === JEVM_ID) {
      await this.executeJEVMTransfer(provider, this.transfer)
    } else {
      this.status = TransferStatus.Error
      throw new TransferError('unsupported export vm id')
    }
  }

  private async executeJVMTransfer (provider: MCNProvider, transfer: Transfer): Promise<void> {
    const sourceChain: JVMBlockchain = transfer.sourceChain as JVMBlockchain
    const destinationChain: Blockchain & Crossable = transfer.destinationChain as Blockchain & Crossable
    const wallet: VMWallet = transfer.signer.getWallet(sourceChain)
    const senders: string[] = [wallet.getAddress()]
    const utxoSet: Utxo[] = await fetchUtxos(provider.jvm, senders)
    const exportFee: bigint = await sourceChain.queryExportFee(provider)
    const importFee: bigint = await destinationChain.queryImportFee(provider, transfer.userInputs)
    let exportingFee: boolean = true
    if (destinationChain.canPayImportFee()) {
      const balance: JVMAccount = new JVMAccount(provider, transfer.signer)
      await balance.fetchAllBalances()
      const sourceBalance: bigint = balance.getBalance(destinationChain.asset).value
      exportingFee = sourceBalance >= importFee
    }
    const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, TransactionType.Export, '???', '???')
    this.receipts.push(receipt)
    const exportTransaction: string = jvm.buildJVMExportTransaction(
      transfer.userInputs, utxoSet, senders, transfer.signer.getAddress(destinationChain),
      exportFee, exportingFee ? importFee : BigInt(0), wallet.getAddress(), provider.mcn.id, sourceChain.id
    ).signTransaction([wallet]).toCHex()
    this.status = TransferStatus.Sending
    const transactionId = (await provider.jvm.issueTx(exportTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new JVMTransactionStatusFetcher(provider.jvm, transactionId).fetch(WalletStatusFetcherTimeout)
    receipt.transactionStatus = transactionStatus
    // export transaction did not go through so we cannot safely try to import we stop here
    if (transactionStatus !== JVMTransactionStatus.Accepted) {
      this.status = TransferStatus.Timeout
      return
    }
    const validStatus: boolean = await this.executeImport(provider, transfer, importFee)
    this.status = validStatus ? TransferStatus.Done : TransferStatus.Timeout
  }

  private async executePlatformTransfer (provider: MCNProvider, transfer: Transfer): Promise<void> {
    const sourceChain: PlatformBlockchain = transfer.sourceChain as PlatformBlockchain
    const destinationChain: Blockchain & Crossable = transfer.destinationChain as Blockchain & Crossable
    const wallet: VMWallet = transfer.signer.getWallet(sourceChain)
    const senders: string[] = [wallet.getAddress()]
    const utxoSet: Utxo[] = await fetchUtxos(provider.platform, senders)
    const exportFee: bigint = await sourceChain.queryExportFee(provider)
    const importFee: bigint = await destinationChain.queryImportFee(provider, transfer.userInputs)
    let exportingFee: boolean = true
    if (destinationChain.canPayImportFee()) {
      const balance: PlatformAccount = new PlatformAccount(provider, transfer.signer)
      await balance.fetchAllBalances()
      const sourceBalance: bigint = balance.getBalance(destinationChain.asset).value
      exportingFee = sourceBalance >= importFee
    }
    const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, TransactionType.Export, '???', '???')
    this.receipts.push(receipt)
    const exportTransaction: string = platform.buildPlatformExportTransaction(
      transfer.userInputs, utxoSet, senders, transfer.signer.getAddress(destinationChain),
      exportFee, exportingFee ? importFee : BigInt(0), wallet.getAddress(), provider.mcn.id, sourceChain.id
    ).signTransaction([wallet]).toCHex()
    this.status = TransferStatus.Sending
    const transactionId = (await provider.platform.issueTx(exportTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new PlatformTransactionStatusFetcher(provider.platform, transactionId).fetch(WalletStatusFetcherTimeout)
    receipt.transactionStatus = transactionStatus
    // export transaction did not go through so we cannot safely try to import we stop here
    if (transactionStatus !== PlatformTransactionStatus.Committed) {
      this.status = TransferStatus.Timeout
      return
    }
    const validStatus: boolean = await this.executeImport(provider, transfer, importFee)
    this.status = validStatus ? TransferStatus.Done : TransferStatus.Timeout
  }

  private async executeJEVMTransfer (provider: MCNProvider, transfer: Transfer): Promise<void> {
    const sourceChain: JEVMBlockchain = transfer.sourceChain as JEVMBlockchain
    const destinationChain: Blockchain & Crossable = transfer.destinationChain as Blockchain & Crossable
    const wallet: JEVMWallet = transfer.signer.getWallet(sourceChain) as JEVMWallet
    const api: JEVMAPI = provider.jevm[sourceChain.id]
    let nonce: bigint = await api.eth_getTransactionCount(wallet.getHexAddress(), 'pending')
    const gasPrice: bigint = await api.eth_baseFee()
    let destinationFee: bigint = BigInt(0)
    for (let i: number = 0; i < transfer.userInputs.length; i++) {
      const input: UserInput = transfer.userInputs[i]
      if (!JEVMBlockchain.isContractAddress(input.assetId)) {
        continue
      }
      const contract: ContractAdapter | null = await sourceChain.contractHandler.getAdapter(input.assetId)
      // for cross transactions only contract that can handle that should be JRC20
      if (contract === null || !(contract instanceof JRC20ContractAdapter)) {
        this.status = TransferStatus.Error
        return
      }
      // temporary until all JRC20 contracts implement assetId method to retrieve it we must hardcode the data
      // TODO update it when implementation is done properly on all networks
      let assetId: string = ''
      for (let i: number = 0; i < sourceChain.jrc20Assets.length; i++) {
        const jrc20: JRC20Asset = sourceChain.jrc20Assets[i]
        if (jrc20.address === input.assetId) {
          assetId = jrc20.nativeAssetId
          break
        }
      }
      if (assetId === '') {
        this.status = TransferStatus.Error
        return
      }
      let withdrawAmount = input.amount
      // exporting more value to pay for import fee in destination currency
      // because jrc20 can only be in a JEVM chain then we can safely assume
      // that there will be a JVM proxy transfer
      if (destinationFee === BigInt(0) && destinationChain.assetId === assetId) {
        const importFee: bigint = await destinationChain.queryImportFee(provider, transfer.userInputs)
        withdrawAmount += importFee
        destinationFee += importFee
      }
      const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, TransactionType.Withdraw, '???', '???')
      this.receipts.push(receipt)
      const jrc20: JRC20ContractAdapter = contract
      const data: string = jrc20.getWithdrawData(input.assetId, withdrawAmount)
      const gasLimit: bigint = await sourceChain.ethProvider.estimateGas({
        from: wallet.getHexAddress(),
        to: input.assetId,
        value: BigInt(0),
        data
      })
      const transactionData: TransactionRequest = {
        from: wallet.getHexAddress(),
        to: input.assetId,
        value: BigInt(0),
        nonce: Number(nonce++),
        chainId: sourceChain.chainId,
        gasLimit,
        gasPrice,
        data
      }
      const transaction: string = await wallet.evmWallet.signTransaction(transactionData)
      const transactionHash: string = await api.eth_sendRawTransaction(transaction)
      receipt.transactionId = transactionHash
      const transactionStatus: string = await new EVMTransactionStatusFetcher(api, transactionHash).fetch(WalletStatusFetcherTimeout)
      receipt.transactionStatus = transactionStatus
      // asset id must be updated to its JVM id for next export/import tx
      input.assetId = assetId
      if (transactionStatus !== EVMTransactionStatus.Success) {
        this.status = TransferStatus.Timeout
        return
      }
    }
    if (destinationChain.vmId === JEVM_ID) {
      void this.proxyJVMTransfer(provider, transfer, transfer.destinationChain as JEVMBlockchain, destinationFee)
      return
    }
    const exportFee: bigint = await sourceChain.queryExportFee(provider, transfer.userInputs, destinationChain.assetId)
    const importFee: bigint = await destinationChain.queryImportFee(provider, transfer.userInputs)
    let exportingFee: boolean = true
    if (destinationChain.canPayImportFee()) {
      const sourceBalance: bigint = await sourceChain.queryEVMBalance(api, wallet.getHexAddress(), destinationChain.assetId)
      exportingFee = sourceBalance >= importFee
    }
    const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, TransactionType.Export, '???', '???')
    this.receipts.push(receipt)
    const exportTransaction: string = jevm.buildJEVMExportTransaction(
      transfer.userInputs, wallet.getHexAddress(), nonce, transfer.signer.getAddress(destinationChain),
      exportFee, exportingFee ? importFee : BigInt(0), provider.mcn.id
    ).signTransaction([wallet]).toCHex()
    this.status = TransferStatus.Sending
    const transactionId = (await api.issueTx(exportTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new JEVMTransactionStatusFetcher(api, transactionId).fetch(WalletStatusFetcherTimeout)
    receipt.transactionStatus = transactionStatus
    // export transaction did not go through so we cannot safely try to import we stop here
    if (transactionStatus !== JEVMTransactionStatus.Accepted) {
      this.status = TransferStatus.Timeout
      return
    }
    const validStatus: boolean = await this.executeImport(provider, transfer, importFee)
    this.status = validStatus ? TransferStatus.Done : TransferStatus.Timeout
  }

  private async proxyJVMTransfer (provider: MCNProvider, transfer: Transfer, destination: JEVMBlockchain, destinationFee: bigint): Promise<void> {
    const signer: JuneoWallet = transfer.signer
    const jvmChain: JVMBlockchain = provider.jvm.chain
    const toJVMUserInputs: UserInput[] = []
    transfer.userInputs.forEach(input => {
      toJVMUserInputs.push(new UserInput(input.assetId, input.sourceChain, input.amount, signer.getAddress(jvmChain), jvmChain))
    })
    // adding future import fee
    if (destinationFee > BigInt(0)) {
      toJVMUserInputs.push(new UserInput(destination.assetId, transfer.sourceChain, destinationFee, signer.getAddress(jvmChain), jvmChain))
    }
    await this.executeJEVMTransfer(provider, new Transfer(transfer.sourceChain, jvmChain, toJVMUserInputs, signer))
    // if first cross failed then abort
    if (this.status !== TransferStatus.Done) {
      return
    } else {
      this.status = TransferStatus.Sending
    }
    const toJEVMUserInputs: UserInput[] = []
    transfer.userInputs.forEach(input => {
      toJEVMUserInputs.push(new UserInput(input.assetId, jvmChain, input.amount, input.address, destination))
    })
    await this.executeJVMTransfer(provider, new Transfer(jvmChain, destination, toJEVMUserInputs, signer))
  }

  private async executeImport (provider: MCNProvider, transfer: Transfer, importFee: bigint): Promise<boolean> {
    if (transfer.destinationChain.vmId === PLATFORMVM_ID) {
      return await this.executePlatformImport(provider, transfer, importFee)
    } else if (transfer.destinationChain.vmId === JVM_ID) {
      return await this.executeJVMImport(provider, transfer, importFee)
    } else if (transfer.destinationChain.vmId === JEVM_ID) {
      return await this.executeJEVMImport(provider, transfer, importFee)
    } else {
      throw new TransferError('unsupported import vm id')
    }
  }

  private async executePlatformImport (provider: MCNProvider, transfer: Transfer, fee: bigint): Promise<boolean> {
    const wallet: VMWallet = transfer.signer.getWallet(transfer.destinationChain)
    const sourceChain: Blockchain = transfer.sourceChain
    const importUtxo: Utxo[] = await fetchUtxos(provider.platform, [wallet.getAddress()], sourceChain.id)
    const utxos: Utxo[] = await fetchUtxos(provider.platform, [wallet.getAddress()])
    // put import utxos first to priorize usage of imported inputs
    const utxoSet: Utxo[] = importUtxo.concat(utxos)
    const receipt: TransactionReceipt = new TransactionReceipt(transfer.destinationChain.id, TransactionType.Import, '???', '???')
    this.receipts.push(receipt)
    const importTransaction: string = platform.buildPlatformImportTransaction(
      transfer.userInputs, utxoSet, [wallet.getAddress()],
      fee, wallet.getAddress(), provider.mcn.id
    ).signTransaction([wallet]).toCHex()
    const transactionId: string = (await provider.platform.issueTx(importTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new PlatformTransactionStatusFetcher(provider.platform, transactionId).fetch(WalletStatusFetcherTimeout)
    receipt.transactionStatus = transactionStatus
    return transactionStatus === PlatformTransactionStatus.Committed
  }

  private async executeJVMImport (provider: MCNProvider, transfer: Transfer, fee: bigint): Promise<boolean> {
    const wallet: VMWallet = transfer.signer.getWallet(transfer.destinationChain)
    const sourceChain: Blockchain = transfer.sourceChain
    const utxos: Utxo[] = await fetchUtxos(provider.jvm, [wallet.getAddress()])
    const importUtxo: Utxo[] = await fetchUtxos(provider.jvm, [wallet.getAddress()], sourceChain.id)
    // put import utxos first to priorize usage of imported inputs
    const utxoSet: Utxo[] = importUtxo.concat(utxos)
    const receipt: TransactionReceipt = new TransactionReceipt(transfer.destinationChain.id, TransactionType.Import, '???', '???')
    this.receipts.push(receipt)
    const importTransaction: string = jvm.buildJVMImportTransaction(
      transfer.userInputs, utxoSet, [wallet.getAddress()],
      fee, wallet.getAddress(), provider.mcn.id
    ).signTransaction([wallet]).toCHex()
    const transactionId: string = (await provider.jvm.issueTx(importTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new JVMTransactionStatusFetcher(provider.jvm, transactionId).fetch(WalletStatusFetcherTimeout)
    receipt.transactionStatus = transactionStatus
    return transactionStatus === JVMTransactionStatus.Accepted
  }

  private async executeJEVMImport (provider: MCNProvider, transfer: Transfer, fee: bigint): Promise<boolean> {
    const evmChain: JEVMBlockchain = transfer.destinationChain as JEVMBlockchain
    const wallet: JEVMWallet = transfer.signer.getWallet(evmChain) as JEVMWallet
    const sourceChain: Blockchain = transfer.sourceChain
    const api: JEVMAPI = provider.jevm[evmChain.id]
    const utxoSet: Utxo[] = await fetchUtxos(api, [wallet.getAddress()], sourceChain.id)
    const importReceipt: TransactionReceipt = new TransactionReceipt(evmChain.id, TransactionType.Import, '???', '???')
    this.receipts.push(importReceipt)
    const fixedUserInputs: UserInput[] = []
    for (let i = 0; i < transfer.userInputs.length; i++) {
      const input: UserInput = transfer.userInputs[i]
      // the only case that could do such transaction is the transfer of a JRC20
      // in that case we must import to self to be able to deposit and then
      // call the ERC20 transfer function
      if (input.assetId !== evmChain.assetId) {
        fixedUserInputs.push(new UserInput(input.assetId, input.sourceChain, input.amount, wallet.getHexAddress(), input.destinationChain))
      } else {
        fixedUserInputs.push(input)
      }
    }
    const importTransaction: string = jevm.buildJEVMImportTransaction(
      fixedUserInputs, utxoSet, [wallet.getAddress()], fee, provider.mcn.id
    ).signTransaction([wallet]).toCHex()
    const transactionId: string = (await api.issueTx(importTransaction)).txID
    importReceipt.transactionId = transactionId
    const importTransactionStatus: string = await new JEVMTransactionStatusFetcher(api, transactionId).fetch(WalletStatusFetcherTimeout)
    importReceipt.transactionStatus = importTransactionStatus
    if (importTransactionStatus !== JEVMTransactionStatus.Accepted) {
      return false
    }
    // checking if one of the imported assets has a jrc20 contract address
    // to move it out from shared memory and wrap it as an erc20 token
    let nonce: bigint = await api.eth_getTransactionCount(wallet.getHexAddress(), 'pending')
    const gasPrice: bigint = await api.eth_baseFee()
    for (let i: number = 0; i < transfer.userInputs.length; i++) {
      const input: UserInput = transfer.userInputs[i]
      let contractAddress: string = ''
      for (let i: number = 0; i < evmChain.jrc20Assets.length; i++) {
        const jrc20: JRC20Asset = evmChain.jrc20Assets[i]
        if (jrc20.nativeAssetId === input.assetId) {
          contractAddress = jrc20.address
          break
        }
      }
      // found an input with a smart contract address
      if (contractAddress !== '') {
        const contract: ContractAdapter | null = await evmChain.contractHandler.getAdapter(contractAddress)
        // for cross transactions only contract that can handle that should be JRC20
        if (contract === null || !(contract instanceof JRC20ContractAdapter)) {
          return false
        }
        const depositReceipt: TransactionReceipt = new TransactionReceipt(evmChain.id, TransactionType.Deposit, '???', '???')
        this.receipts.push(depositReceipt)
        const jrc20: JRC20ContractAdapter = contract
        const data: string = jrc20.getDepositData(contractAddress, input.assetId, input.amount)
        const gasLimit: bigint = await evmChain.ethProvider.estimateGas({
          from: wallet.getHexAddress(),
          to: NativeAssetCallContract,
          value: BigInt(0),
          data
        })
        const transactionData: TransactionRequest = {
          from: wallet.getHexAddress(),
          to: NativeAssetCallContract,
          value: BigInt(0),
          nonce: Number(nonce++),
          chainId: evmChain.chainId,
          gasLimit,
          gasPrice,
          data
        }
        const depositTransaction: string = await wallet.evmWallet.signTransaction(transactionData)
        const transactionHash: string = await api.eth_sendRawTransaction(depositTransaction)
        depositReceipt.transactionId = transactionHash
        const depositTransactionStatus: string = await new EVMTransactionStatusFetcher(api, transactionHash).fetch(WalletStatusFetcherTimeout)
        depositReceipt.transactionStatus = depositTransactionStatus
        if (depositTransactionStatus !== EVMTransactionStatus.Success) {
          return false
        }
        // if we need to transfer the JRC20 to another destination than the sender
        if (input.address !== wallet.getHexAddress()) {
          const transferReceipt: TransactionReceipt = new TransactionReceipt(evmChain.id, TransactionType.Send, '???', '???')
          this.receipts.push(transferReceipt)
          const gasLimit: bigint = await evmChain.estimateGasLimit(contractAddress, wallet.getHexAddress(), input.address, input.amount)
          const transactionData: TransactionRequest = {
            from: wallet.getHexAddress(),
            to: contractAddress,
            value: BigInt(0),
            nonce: Number(nonce++),
            chainId: evmChain.chainId,
            gasLimit,
            gasPrice,
            data: await evmChain.getContractTransactionData(contractAddress, input.address, input.amount)
          }
          const transaction: string = await wallet.evmWallet.signTransaction(transactionData)
          const transactionHash: string = await api.eth_sendRawTransaction(transaction)
          transferReceipt.transactionId = transactionHash
          const transactionStatus: string = await new EVMTransactionStatusFetcher(api, transactionHash).fetch(WalletStatusFetcherTimeout)
          transferReceipt.transactionStatus = transactionStatus
          if (transactionStatus !== EVMTransactionStatus.Success) {
            return false
          }
        }
      }
    }
    return true
  }
}
