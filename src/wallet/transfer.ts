import { type Blockchain, JVM_ID, isCrossable } from '../chain'
import { type MCNProvider } from '../juneo'
import { FeeManager, JVMTransactionStatus, JVMTransactionStatusFetcher, type UserInput, type Utxo } from '../transaction'
import { InterChainTransferError, IntraChainTransferError, TransferError } from '../utils'
import { type JuneoWallet, type VMWallet } from './wallet'
import * as jvm from '../transaction/jvm'
import { parseUtxoSet } from '../transaction/builder'

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
  transactionId: string | undefined
  transactionStatus: string | undefined

  constructor (chainId: string) {
    this.chainId = chainId
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
    const fees: number = (await provider.getFees()).txFee
    const chainId: string = transfer.sourceChain.id
    const receipt: TransactionReceipt = new TransactionReceipt(chainId)
    this.receipts.push(receipt)
    const transaction: string = jvm.buildJVMBaseTransaction(
      transfer.userInputs, utxoSet, senders, BigInt(fees),
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
    // if (transfer.sourceChain.vmId === JVM_ID) {
    // await this.executeJVMTransfer(provider, transfer)
    if (false) {
    } else {
      this.status = TransferStatus.Error
      throw new InterChainTransferError('unsupported vm id')
    }
  }
}
