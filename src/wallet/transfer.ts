import { type Blockchain, JVM_ID, isCrossable, type Crossable, RELAYVM_ID, type JVMBlockchain, type RelayBlockchain, JEVM_ID, JEVMBlockchain } from '../chain'
import { type MCNProvider } from '../juneo'
import { JVMTransactionStatus, JVMTransactionStatusFetcher, type UserInput, type Utxo, RelayTransactionStatusFetcher, RelayTransactionStatus } from '../transaction'
import { InterChainTransferError, IntraChainTransferError, TransferError } from '../utils'
import { type JEVMWallet, type JuneoWallet, type VMWallet } from './wallet'
import { parseUtxoSet } from '../transaction/builder'
import * as jvm from '../transaction/jvm'
import * as jevm from '../transaction/jevm'
import * as relay from '../transaction/relay'
import { type JEVMAPI } from '../api/jevm'
import { EVMTransactionStatusFetcher, JEVMTransactionStatus, JEVMTransactionStatusFetcher } from '../transaction/jevm'
import { type ethers } from 'ethers'
import { type TransactionRequest } from 'ethers/types/providers'

const StatusFetcherDelay: number = 100
const StatusFetcherMaxAttempts: number = 600

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

export enum TransactionType {
  Base = 'Base transaction',
  Send = 'Send transaction',
  Export = 'Export transaction',
  Import = 'Import transaction'
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
      const txFee: bigint = await source.queryBaseFee(this.provider)
      summaries.push(new TransferSummary(TransferType.Base, inputs, source, txFee))
    }
    for (const key in interTransfersInputs) {
      const inputs: UserInput[] = interTransfersInputs[key]
      // because of previously sorting should always be safe casting here
      const source: Blockchain & Crossable = inputs[0].sourceChain as unknown as Blockchain & Crossable
      const destination: Blockchain & Crossable = inputs[0].destinationChain as unknown as Blockchain & Crossable
      const exportFee: bigint = await source.queryExportFee(this.provider, inputs, destination.assetId)
      const importFee: bigint = await destination.queryImportFee(this.provider, inputs)
      summaries.push(new TransferSummary(TransferType.Cross, inputs, source, exportFee + importFee))
    }
    return summaries
  }

  transfer (userInputs: UserInput[]): TransferHandler[] {
    const transfersInputs: Array<Record<string, UserInput[]>> = this.sortInputs(userInputs)
    const intraTransfersInputs: Record<string, UserInput[]> = transfersInputs[0]
    const interTransfersInputs: Record<string, UserInput[]> = transfersInputs[1]
    const handlers: ExecutableTransferHandler[] = []
    for (const key in intraTransfersInputs) {
      const inputs: UserInput[] = intraTransfersInputs[key]
      const intraTransfer: Transfer = new Transfer(
        inputs[0].sourceChain, inputs[0].destinationChain, inputs, this.wallet
      )
      handlers.push(new IntraChainTransferHandler(intraTransfer))
    }
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
    // do not forget to isolate user inputs again to do its
    // note that fee cost will be higher for non batched transactions
    userInputs.forEach(input => {
      if (input.amount < BigInt(1)) {
        throw new TransferError('input amount must be greater than 0')
      }
      if (!input.destinationChain.validateAddress(input.address)) {
        throw new TransferError(`invalid input address for destination chain: ${input.address}`)
      }
      const sourceId: string = input.sourceChain.id
      // inter chain transfer case
      if (sourceId !== input.destinationChain.id) {
        // for now only crossable compatible chains can do inter chain transfers
        if (!isCrossable(input.sourceChain) || !isCrossable(input.destinationChain)) {
          throw new TransferError('both chains must implement Crossable to do inter chain transfer')
        }
        if (interTransfersInputs[sourceId] === undefined) {
          interTransfersInputs[sourceId] = [input]
        } else {
          interTransfersInputs[sourceId].push(input)
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
  fee: bigint

  constructor (type: string, sortedInputs: UserInput[], sourceChain: Blockchain, fee: bigint) {
    this.type = type
    this.sortedInputs = sortedInputs
    this.sourceChain = sourceChain
    this.fee = fee
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

export class TransactionReceipt {
  chainId: string
  transactionType: string
  transactionId: string | undefined
  transactionStatus: string | undefined

  constructor (chainId: string, transactionType: string) {
    this.chainId = chainId
    this.transactionType = transactionType
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

class IntraChainTransferHandler implements ExecutableTransferHandler {
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
    } else if (this.transfer.sourceChain.vmId === JEVM_ID) {
      await this.executeJEVMTransfer(provider, this.transfer)
    } else {
      this.status = TransferStatus.Error
      throw new IntraChainTransferError('unsupported vm id')
    }
  }

  private async executeJVMTransfer (provider: MCNProvider, transfer: Transfer): Promise<void> {
    const wallet: VMWallet = transfer.signer.getWallet(transfer.sourceChain)
    const senders: string[] = [wallet.getAddress()]
    const utxoSet: Utxo[] = parseUtxoSet(await provider.jvm.getUTXOs(senders))
    const fee: bigint = await transfer.sourceChain.queryBaseFee(provider)
    const chainId: string = transfer.sourceChain.id
    const receipt: TransactionReceipt = new TransactionReceipt(chainId, TransactionType.Base)
    this.receipts.push(receipt)
    const transaction: string = jvm.buildJVMBaseTransaction(
      transfer.userInputs, utxoSet, senders, fee,
      wallet.getAddress(), provider.mcn.id, chainId
    ).signTransaction([wallet]).toCHex()
    this.status = TransferStatus.Sending
    const transactionId = (await provider.jvm.issueTx(transaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new JVMTransactionStatusFetcher(provider.jvm,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    receipt.transactionStatus = transactionStatus
    if (transactionStatus !== JVMTransactionStatus.Accepted) {
      this.status = TransferStatus.Timeout
    } else {
      this.status = TransferStatus.Done
    }
  }

  private async executeJEVMTransfer (provider: MCNProvider, transfer: Transfer): Promise<void> {
    const sourceChain: JEVMBlockchain = transfer.sourceChain as JEVMBlockchain
    const wallet: JEVMWallet = transfer.signer.getWallet(sourceChain) as JEVMWallet
    const ethProvider: ethers.JsonRpcProvider = sourceChain.ethProvider
    const evmWallet: ethers.Wallet = wallet.evmWallet.connect(ethProvider)
    const api: JEVMAPI = provider.jevm[sourceChain.id]
    let nonce: bigint = await api.eth_getTransactionCount(wallet.getHexAddress(), 'latest')
    const gasPrice: bigint = await api.eth_baseFee()
    this.status = TransferStatus.Sending
    for (let i: number = 0; i < transfer.userInputs.length; i++) {
      const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, TransactionType.Send)
      this.receipts.push(receipt)
      const input: UserInput = transfer.userInputs[i]
      const transactionData: TransactionRequest = {
        from: evmWallet.address,
        to: input.address,
        value: input.amount,
        nonce: Number(nonce++),
        chainId: sourceChain.chainId,
        gasLimit: JEVMBlockchain.SendEtherGasLimit,
        gasPrice
      }
      const transaction: string = await evmWallet.signTransaction(transactionData)
      const transactionHash: string = await api.eth_sendRawTransaction(transaction)
      receipt.transactionId = transactionHash
      const transactionStatus: string = await new EVMTransactionStatusFetcher(api,
        StatusFetcherDelay, StatusFetcherMaxAttempts, transactionHash).fetch()
      receipt.transactionStatus = transactionStatus
      if (transactionStatus !== JEVMTransactionStatus.Accepted) {
        this.status = TransferStatus.Timeout
      } else {
        this.status = TransferStatus.Done
      }
    }
  }
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
    } else if (this.transfer.sourceChain.vmId === RELAYVM_ID) {
      await this.executeRelayTransfer(provider, this.transfer)
    } else if (this.transfer.sourceChain.vmId === JEVM_ID) {
      await this.executeJEVMTransfer(provider, this.transfer)
    } else {
      this.status = TransferStatus.Error
      throw new InterChainTransferError('unsupported export vm id')
    }
  }

  private async executeJVMTransfer (provider: MCNProvider, transfer: Transfer): Promise<void> {
    const sourceChain: JVMBlockchain = transfer.sourceChain as JVMBlockchain
    const destinationChain: Blockchain & Crossable = transfer.destinationChain as Blockchain & Crossable
    const wallet: VMWallet = transfer.signer.getWallet(sourceChain)
    const senders: string[] = [wallet.getAddress()]
    const utxoSet: Utxo[] = parseUtxoSet(await provider.jvm.getUTXOs(senders))
    const exportFee: bigint = await sourceChain.queryExportFee(provider)
    const importFee: bigint = await destinationChain.queryImportFee(provider, transfer.userInputs)
    const sourceBalance: bigint = await sourceChain.queryBalance(provider, wallet.getAddress(), destinationChain.assetId)
    const canExportFee: boolean = sourceBalance >= importFee
    const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, TransactionType.Export)
    this.receipts.push(receipt)
    const exportTransaction: string = jvm.buildJVMExportTransaction(
      transfer.userInputs, utxoSet, senders, transfer.signer.getAddress(destinationChain),
      exportFee, canExportFee ? importFee : BigInt(0), wallet.getAddress(), provider.mcn.id, sourceChain.id
    ).signTransaction([wallet]).toCHex()
    this.status = TransferStatus.Sending
    const transactionId = (await provider.jvm.issueTx(exportTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new JVMTransactionStatusFetcher(provider.jvm,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    receipt.transactionStatus = transactionStatus
    // export transaction did not go through so we cannot safely try to import we stop here
    if (transactionStatus !== JVMTransactionStatus.Accepted) {
      this.status = TransferStatus.Timeout
      return
    }
    const validStatus: boolean = await this.executeImport(provider, transfer, importFee, canExportFee)
    this.status = validStatus ? TransferStatus.Done : TransferStatus.Timeout
  }

  private async executeRelayTransfer (provider: MCNProvider, transfer: Transfer): Promise<void> {
    const sourceChain: RelayBlockchain = transfer.sourceChain as RelayBlockchain
    const destinationChain: Blockchain & Crossable = transfer.destinationChain as Blockchain & Crossable
    const wallet: VMWallet = transfer.signer.getWallet(sourceChain)
    const senders: string[] = [wallet.getAddress()]
    const utxoSet: Utxo[] = parseUtxoSet(await provider.relay.getUTXOs(senders))
    const exportFee: bigint = await sourceChain.queryExportFee(provider)
    const importFee: bigint = await destinationChain.queryImportFee(provider, transfer.userInputs)
    const sourceBalance: bigint = await sourceChain.queryBalance(provider, wallet.getAddress(), destinationChain.assetId)
    const canExportFee: boolean = sourceBalance >= importFee
    const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, TransactionType.Export)
    this.receipts.push(receipt)
    const exportTransaction: string = relay.buildRelayExportTransaction(
      transfer.userInputs, utxoSet, senders, transfer.signer.getAddress(destinationChain),
      exportFee, canExportFee ? importFee : BigInt(0), wallet.getAddress(), provider.mcn.id, sourceChain.id
    ).signTransaction([wallet]).toCHex()
    this.status = TransferStatus.Sending
    const transactionId = (await provider.relay.issueTx(exportTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new RelayTransactionStatusFetcher(provider.relay,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    receipt.transactionStatus = transactionStatus
    // export transaction did not go through so we cannot safely try to import we stop here
    if (transactionStatus !== RelayTransactionStatus.Committed) {
      this.status = TransferStatus.Timeout
      return
    }
    const validStatus: boolean = await this.executeImport(provider, transfer, importFee, canExportFee)
    this.status = validStatus ? TransferStatus.Done : TransferStatus.Timeout
  }

  private async executeJEVMTransfer (provider: MCNProvider, transfer: Transfer): Promise<void> {
    const sourceChain: JEVMBlockchain = transfer.sourceChain as JEVMBlockchain
    const destinationChain: Blockchain & Crossable = transfer.destinationChain as Blockchain & Crossable
    const wallet: JEVMWallet = transfer.signer.getWallet(sourceChain) as JEVMWallet
    const exportFee: bigint = await sourceChain.queryExportFee(provider, transfer.userInputs, destinationChain.assetId)
    const importFee: bigint = await destinationChain.queryImportFee(provider, transfer.userInputs)
    const sourceBalance: bigint = await sourceChain.queryBalance(provider, wallet.getHexAddress(), destinationChain.assetId)
    const canExportFee: boolean = sourceBalance >= importFee
    const api: JEVMAPI = provider.jevm[sourceChain.id]
    const nonce: bigint = await api.eth_getTransactionCount(wallet.getHexAddress(), 'latest')
    const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, TransactionType.Export)
    this.receipts.push(receipt)
    const exportTransaction: string = jevm.buildJEVMExportTransaction(
      transfer.userInputs, wallet.getHexAddress(), nonce, transfer.signer.getAddress(destinationChain),
      exportFee, canExportFee ? importFee : BigInt(0), provider.mcn.id
    ).signTransaction([wallet]).toCHex()
    this.status = TransferStatus.Sending
    const transactionId = (await api.issueTx(exportTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new JEVMTransactionStatusFetcher(api,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    receipt.transactionStatus = transactionStatus
    // export transaction did not go through so we cannot safely try to import we stop here
    if (transactionStatus !== JEVMTransactionStatus.Accepted) {
      this.status = TransferStatus.Timeout
      return
    }
    const validStatus: boolean = await this.executeImport(provider, transfer, importFee, canExportFee)
    this.status = validStatus ? TransferStatus.Done : TransferStatus.Timeout
  }

  private async executeImport (provider: MCNProvider, transfer: Transfer, importFee: bigint, isFeeExported: boolean): Promise<boolean> {
    if (transfer.destinationChain.vmId === RELAYVM_ID) {
      return await this.executeRelayImport(provider, transfer, importFee, isFeeExported)
    } else if (transfer.destinationChain.vmId === JVM_ID) {
      return await this.executeJVMImport(provider, transfer, importFee, isFeeExported)
    } else if (transfer.destinationChain.vmId === JEVM_ID) {
      return await this.executeJEVMImport(provider, transfer, importFee, isFeeExported)
    } else {
      throw new InterChainTransferError('unsupported import vm id')
    }
  }

  private async executeRelayImport (provider: MCNProvider, transfer: Transfer, fee: bigint, isFeeImported: boolean): Promise<boolean> {
    const wallet: VMWallet = transfer.signer.getWallet(transfer.destinationChain)
    const sourceChain: Blockchain = transfer.sourceChain
    let utxoSet: Utxo[] = parseUtxoSet(await provider.relay.getUTXOs([wallet.getAddress()], sourceChain.id))
    if (!isFeeImported) {
      const utxos: Utxo[] = parseUtxoSet(await provider.relay.getUTXOs([wallet.getAddress()]))
      utxoSet = utxoSet.concat(utxos)
    }
    const receipt: TransactionReceipt = new TransactionReceipt(transfer.destinationChain.id, TransactionType.Import)
    this.receipts.push(receipt)
    const importTransaction: string = relay.buildRelayImportTransaction(
      transfer.userInputs, utxoSet, [wallet.getAddress()],
      fee, wallet.getAddress(), provider.mcn.id
    ).signTransaction([wallet]).toCHex()
    const transactionId: string = (await provider.relay.issueTx(importTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new RelayTransactionStatusFetcher(provider.relay,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    receipt.transactionStatus = transactionStatus
    return transactionStatus === RelayTransactionStatus.Committed
  }

  private async executeJVMImport (provider: MCNProvider, transfer: Transfer, fee: bigint, isFeeImported: boolean): Promise<boolean> {
    const wallet: VMWallet = transfer.signer.getWallet(transfer.destinationChain)
    const sourceChain: Blockchain = transfer.sourceChain
    let utxoSet: Utxo[] = parseUtxoSet(await provider.jvm.getUTXOs([wallet.getAddress()], sourceChain.id))
    if (!isFeeImported) {
      const utxos: Utxo[] = parseUtxoSet(await provider.jvm.getUTXOs([wallet.getAddress()]))
      utxoSet = utxoSet.concat(utxos)
    }
    const receipt: TransactionReceipt = new TransactionReceipt(transfer.destinationChain.id, TransactionType.Import)
    this.receipts.push(receipt)
    const importTransaction: string = jvm.buildJVMImportTransaction(
      transfer.userInputs, utxoSet, [wallet.getAddress()],
      fee, wallet.getAddress(), provider.mcn.id
    ).signTransaction([wallet]).toCHex()
    const transactionId: string = (await provider.jvm.issueTx(importTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new JVMTransactionStatusFetcher(provider.jvm,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    receipt.transactionStatus = transactionStatus
    return transactionStatus === JVMTransactionStatus.Accepted
  }

  private async executeJEVMImport (provider: MCNProvider, transfer: Transfer, fee: bigint, isFeeImported: boolean): Promise<boolean> {
    const wallet: VMWallet = transfer.signer.getWallet(transfer.destinationChain)
    const sourceChain: Blockchain = transfer.sourceChain
    const api: JEVMAPI = provider.jevm[transfer.destinationChain.id]
    let utxoSet: Utxo[] = parseUtxoSet(await api.getUTXOs([wallet.getAddress()], sourceChain.id))
    if (!isFeeImported) {
      const utxos: Utxo[] = parseUtxoSet(await api.getUTXOs([wallet.getAddress()]))
      utxoSet = utxoSet.concat(utxos)
    }
    const receipt: TransactionReceipt = new TransactionReceipt(transfer.destinationChain.id, TransactionType.Import)
    this.receipts.push(receipt)
    const importTransaction: string = jevm.buildJEVMImportTransaction(
      transfer.userInputs, utxoSet, [wallet.getAddress()], fee, provider.mcn.id
    ).signTransaction([wallet]).toCHex()
    const transactionId: string = (await api.issueTx(importTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new JEVMTransactionStatusFetcher(api,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    receipt.transactionStatus = transactionStatus
    return transactionStatus === JEVMTransactionStatus.Accepted
  }
}
