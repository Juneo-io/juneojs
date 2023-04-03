import { type Blockchain, JVM_ID, isCrossable, type Crossable, RELAYVM_ID, type JVMBlockchain, type RelayBlockchain } from '../chain'
import { type MCNProvider } from '../juneo'
import { FeeManager, JVMTransactionStatus, JVMTransactionStatusFetcher, type UserInput, type Utxo, RelayTransactionStatusFetcher, RelayTransactionStatus } from '../transaction'
import { InterChainTransferError, IntraChainTransferError, TransferError } from '../utils'
import { type JuneoWallet, type VMWallet } from './wallet'
import { parseUtxoSet } from '../transaction/builder'
import * as jvm from '../transaction/jvm'
import * as relay from '../transaction/relay'

const StatusFetcherDelay: number = 100
const StatusFetcherMaxAttempts: number = 600

export enum TransferStatus {
  Initializing = 'Initializing',
  Sending = 'Sending',
  Done = 'Done',
  Timeout = 'Timeout',
  Error = 'Error'
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
      const txFee: bigint = await FeeManager.calculate(this.provider, source, source)
      summaries.push(new TransferSummary('Base transaction', source, txFee))
    }
    for (const key in interTransfersInputs) {
      const inputs: UserInput[] = interTransfersInputs[key]
      const source: Blockchain = inputs[0].sourceChain
      const destination: Blockchain = inputs[0].destinationChain
      const txFee: bigint = await FeeManager.calculate(this.provider, source, destination)
      summaries.push(new TransferSummary('Cross chain transaction', source, txFee))
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
      const handler: ExecutableTransferHandler = new IntraChainTransferHandler()
      handlers.push(handler)
      void handler.execute(this.provider, intraTransfer)
    }
    for (const key in interTransfersInputs) {
      const inputs: UserInput[] = interTransfersInputs[key]
      const interTransfer: Transfer = new Transfer(
        inputs[0].sourceChain, inputs[0].destinationChain, inputs, this.wallet
      )
      const handler: ExecutableTransferHandler = new InterChainTransferHandler()
      handlers.push(handler)
      void handler.execute(this.provider, interTransfer)
    }
    return handlers
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
  sourceChain: Blockchain
  fee: bigint

  constructor (type: string, sourceChain: Blockchain, fee: bigint) {
    this.type = type
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

  execute: (provider: MCNProvider, transfer: Transfer) => Promise<void>

}

class IntraChainTransferHandler implements ExecutableTransferHandler {
  private status: string = TransferStatus.Initializing
  private transfer: Transfer | undefined
  private readonly receipts: TransactionReceipt[] = []

  getStatus (): string {
    return this.status
  }

  getTransfer (): Transfer | undefined {
    return this.transfer
  }

  getCurrentReceipts (): TransactionReceipt[] {
    return this.receipts
  }

  async execute (provider: MCNProvider, transfer: Transfer): Promise<void> {
    this.transfer = transfer
    if (transfer.sourceChain.vmId === JVM_ID) {
      await this.executeJVMTransfer(provider, transfer)
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
    const receipt: TransactionReceipt = new TransactionReceipt(chainId, 'Base transaction')
    this.receipts.push(receipt)
    const transaction: string = jvm.buildJVMBaseTransaction(
      transfer.userInputs, utxoSet, senders, fee,
      wallet.getAddress(), provider.mcn.id, chainId
    ).sign([wallet]).toCHex()
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
}

class InterChainTransferHandler implements ExecutableTransferHandler {
  private status: string = TransferStatus.Initializing
  private transfer: Transfer | undefined
  private readonly receipts: TransactionReceipt[] = []

  getStatus (): string {
    return this.status
  }

  getTransfer (): Transfer | undefined {
    return this.transfer
  }

  getCurrentReceipts (): TransactionReceipt[] {
    return this.receipts
  }

  async execute (provider: MCNProvider, transfer: Transfer): Promise<void> {
    this.transfer = transfer
    if (transfer.sourceChain.vmId === JVM_ID) {
      await this.executeJVMTransfer(provider, transfer)
    } else if (transfer.sourceChain.vmId === RELAYVM_ID) {
      await this.executeRelayTransfer(provider, transfer)
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
    const importFee: bigint = await destinationChain.queryImportFee(provider)
    const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, 'Export transaction')
    this.receipts.push(receipt)
    const exportTransaction: string = jvm.buildJVMExportTransaction(
      transfer.userInputs, utxoSet, senders, transfer.signer.getAddress(destinationChain),
      exportFee, importFee, wallet.getAddress(), provider.mcn.id, sourceChain.id
    ).sign([wallet]).toCHex()
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
    const validStatus: boolean = await this.executeImport(provider, transfer, importFee)
    this.status = validStatus ? TransferStatus.Done : TransferStatus.Timeout
  }

  private async executeRelayTransfer (provider: MCNProvider, transfer: Transfer): Promise<void> {
    const sourceChain: RelayBlockchain = transfer.sourceChain as RelayBlockchain
    const destinationChain: Blockchain & Crossable = transfer.destinationChain as Blockchain & Crossable
    const wallet: VMWallet = transfer.signer.getWallet(sourceChain)
    const senders: string[] = [wallet.getAddress()]
    const utxoSet: Utxo[] = parseUtxoSet(await provider.relay.getUTXOs(senders))
    const exportFee: bigint = await sourceChain.queryExportFee(provider)
    const importFee: bigint = await destinationChain.queryImportFee(provider)
    const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, 'Export transaction')
    this.receipts.push(receipt)
    const exportTransaction: string = relay.buildRelayExportTransaction(
      transfer.userInputs, utxoSet, senders, transfer.signer.getAddress(destinationChain),
      exportFee, importFee, wallet.getAddress(), provider.mcn.id, sourceChain.id
    ).sign([wallet]).toCHex()
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
    const validStatus: boolean = await this.executeImport(provider, transfer, importFee)
    this.status = validStatus ? TransferStatus.Done : TransferStatus.Timeout
  }

  private async executeImport (provider: MCNProvider, transfer: Transfer, importFee: bigint): Promise<boolean> {
    if (transfer.destinationChain.vmId === RELAYVM_ID) {
      return await this.executeRelayImport(provider, transfer, importFee)
    } else if (transfer.destinationChain.vmId === JVM_ID) {
      return await this.executeJVMImport(provider, transfer, importFee)
    }
    throw new InterChainTransferError('unsupported import vm id')
  }

  private async executeRelayImport (provider: MCNProvider, transfer: Transfer, fee: bigint): Promise<boolean> {
    const wallet: VMWallet = transfer.signer.getWallet(transfer.destinationChain)
    const sourceChain: Blockchain = transfer.sourceChain
    const utxoSet: Utxo[] = parseUtxoSet(await provider.relay.getUTXOs([wallet.getAddress()], sourceChain.id))
    const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, 'Import transaction')
    this.receipts.push(receipt)
    const importTransaction: string = relay.buildRelayImportTransaction(
      transfer.userInputs, utxoSet, [wallet.getAddress()],
      fee, wallet.getAddress(), provider.mcn.id
    ).sign([transfer.signer.getWallet(sourceChain)]).toCHex()
    const transactionId: string = (await provider.relay.issueTx(importTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new RelayTransactionStatusFetcher(provider.relay,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    receipt.transactionStatus = transactionStatus
    return transactionStatus === RelayTransactionStatus.Committed
  }

  private async executeJVMImport (provider: MCNProvider, transfer: Transfer, fee: bigint): Promise<boolean> {
    const wallet: VMWallet = transfer.signer.getWallet(transfer.destinationChain)
    const sourceChain: Blockchain = transfer.sourceChain
    const utxoSet: Utxo[] = parseUtxoSet(await provider.jvm.getUTXOs([wallet.getAddress()], sourceChain.id))
    const receipt: TransactionReceipt = new TransactionReceipt(sourceChain.id, 'Import transaction')
    this.receipts.push(receipt)
    const importTransaction: string = jvm.buildJVMImportTransaction(
      transfer.userInputs, utxoSet, [wallet.getAddress()],
      fee, wallet.getAddress(), provider.mcn.id
    ).sign([transfer.signer.getWallet(sourceChain)]).toCHex()
    const transactionId: string = (await provider.jvm.issueTx(importTransaction)).txID
    receipt.transactionId = transactionId
    const transactionStatus: string = await new JVMTransactionStatusFetcher(provider.jvm,
      StatusFetcherDelay, StatusFetcherMaxAttempts, transactionId).fetch()
    receipt.transactionStatus = transactionStatus
    return transactionStatus === JVMTransactionStatus.Accepted
  }
}
