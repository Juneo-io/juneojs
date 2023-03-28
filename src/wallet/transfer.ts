import { type Blockchain, JVM_ID } from '../chain'
import { type MCNProvider } from '../juneo'
import { JVMTransactionStatus, JVMTransactionStatusFetcher, type UserInput, type Utxo } from '../transaction'
import { IntraChainTransferError, TransferError } from '../utils'
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

  calculate (userInputs: UserInput[]): FeeSummary[] {
    // TODO placeholder
    return [new FeeSummary(0)]
  }

  transfer (userInputs: UserInput[]): TransferHandler[] {
    if (userInputs.length < 1) {
      throw new TransferError('user inputs cannot be empty')
    }
    const intraTransfersInputs: Record<string, UserInput[]> = {}
    userInputs.forEach(input => {
      const sourceId: string = input.sourceChain.id
      if (sourceId !== input.destinationChain.id) {
        throw new TransferError('inter chain transfers is not supported yet')
      }
      if (intraTransfersInputs[sourceId] === undefined) {
        intraTransfersInputs[sourceId] = [input]
      } else {
        intraTransfersInputs[sourceId].push(input)
      }
    })
    const handlers: ExecutableTransferHandler[] = []
    for (const key in intraTransfersInputs) {
      const inputs: UserInput[] = intraTransfersInputs[key]
      const intraTransfer: IntraChainTransfer = new IntraChainTransfer(
        inputs[0].sourceChain, inputs, this.wallet
      )
      const handler: ExecutableTransferHandler = new IntraChainTransferHandler()
      handlers.push(handler)
      void handler.execute(this.provider, intraTransfer)
    }
    return handlers
  }
}

export class FeeSummary {
  fees: number

  constructor (fees: number) {
    this.fees = fees
  }

  getFees (): number {
    return this.fees
  }
}

export interface Transfer {
  id: number
  sourceChain: Blockchain
  userInputs: UserInput[]
  signer: JuneoWallet
}

abstract class AbstractTransfer implements Transfer {
  private static nextId: number = 0
  id: number
  sourceChain: Blockchain
  userInputs: UserInput[]
  signer: JuneoWallet

  constructor (sourceChain: Blockchain, userInputs: UserInput[], signer: JuneoWallet) {
    this.id = AbstractTransfer.nextId++
    this.sourceChain = sourceChain
    this.userInputs = userInputs
    this.signer = signer
  }
}

class IntraChainTransfer extends AbstractTransfer {
  constructor (sourceChain: Blockchain, userInputs: UserInput[], signer: JuneoWallet) {
    super(sourceChain, userInputs, signer)
  }
}

class InterChainTransfer extends AbstractTransfer {
  destinationChain: Blockchain

  constructor (sourceChain: Blockchain, userInputs: UserInput[], signer: JuneoWallet, destinationChain: Blockchain) {
    super(sourceChain, userInputs, signer)
    this.destinationChain = destinationChain
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

  async execute (provider: MCNProvider, transfer: IntraChainTransfer): Promise<void> {
    this.transfer = transfer
    if (transfer.sourceChain.vmId === JVM_ID) {
      await this.executeJVMTransfer(provider, transfer); return
    }
    this.status = TransferStatus.Error
    throw new IntraChainTransferError('unsupported vm id')
  }

  private async executeJVMTransfer (provider: MCNProvider, transfer: Transfer): Promise<void> {
    const wallet: VMWallet = transfer.signer.getWallet(transfer.sourceChain)
    const senders: string[] = [wallet.getAddress()]
    const utxoSet: Utxo[] = parseUtxoSet(await provider.jvm.getUTXOs(senders))
    const fees: number = (await provider.getFees()).txFee
    const chainId: string = transfer.sourceChain.id
    const receipt: TransactionReceipt = new TransactionReceipt(chainId)
    this.receipts.push(receipt)
    const transaction: string = jvm.buildBaseTransaction(transfer.userInputs, utxoSet, senders, BigInt(fees),
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