import { type GetTxFeeResponse } from '../api/info/data'
import { type Blockchain, JVM_ID } from '../chain'
import { type MCNProvider } from '../juneo'
import { JVMTransactionStatusFetcher, type UserInput, type Utxo } from '../transaction'
import { TransferError } from '../utils'
import { type JuneoWallet, type VMWallet } from './wallet'
import * as jvm from '../transaction/jvm'
import { parseUtxoSet } from '../transaction/builder'

export const TransferStatusInit: string = 'Initializing'
export const TransferStatusSending: string = 'Sending'
export const TransferStatusDone: string = 'Done'
export const TransferStatusError: string = 'Error'

const StatusFetcherDelay: number = 100
const StatusFetcherMaxAttempts: number = 600

export class TransferManager {
  private readonly provider: MCNProvider
  private readonly wallet: JuneoWallet
  private readonly fees: GetTxFeeResponse | undefined
  executed: Record<number, TransferResult> = {}

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  calculate (userInputs: UserInput[]): FeeSummary {
    // TODO placeholder
    return new FeeSummary(0)
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
      handler.handle(this.provider, intraTransfer)
        .then((result: TransferResult) => { this.transferHandlerCallback(result) })
    }
    return handlers
  }

  private transferHandlerCallback (result: TransferResult): void {
    this.executed[result.transfer.id] = result
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

export class TransferResult {
  transfer: Transfer
  transactionStatus: string
  transactionId: string

  constructor (transfer: Transfer, transactionStatus: string, transactionId: string) {
    this.transfer = transfer
    this.transactionStatus = transactionStatus
    this.transactionId = transactionId
  }
}

export interface TransferHandler {

  getStatus: () => string

  getTransactionId: () => string | undefined

}

interface ExecutableTransferHandler extends TransferHandler {

  handle: (provider: MCNProvider, transfer: Transfer) => Promise<TransferResult>

}

class IntraChainTransferHandler implements ExecutableTransferHandler {
  private status: string = TransferStatusInit
  private transactionId: string | undefined

  getStatus (): string {
    return this.status
  }

  getTransactionId (): string | undefined {
    return this.transactionId
  }

  async handle (provider: MCNProvider, transfer: IntraChainTransfer): Promise<TransferResult> {
    if (transfer.sourceChain.vmId === JVM_ID) {
      return await this.handleJVMTransfer(provider, transfer)
    }
    this.status = TransferStatusError
    throw new TransferError('unsupported transfer type')
  }

  async handleJVMTransfer (provider: MCNProvider, transfer: Transfer): Promise<TransferResult> {
    const wallet: VMWallet = transfer.signer.getWallet(transfer.sourceChain)
    const senders: string[] = [wallet.getAddress()]
    const utxoSet: Utxo[] = parseUtxoSet(await provider.jvm.getUTXOs(senders))
    const fees: number = (await provider.getFees()).txFee
    const transaction: string = jvm.buildBaseTransaction(transfer.userInputs, utxoSet, senders, BigInt(fees),
      wallet.getAddress(), provider.mcn.id, transfer.sourceChain.id
    ).sign([wallet]).toCHex()
    this.status = TransferStatusSending
    this.transactionId = (await provider.jvm.issueTx(transaction)).txID
    const transactionStatus: string = await new JVMTransactionStatusFetcher(provider.jvm,
      StatusFetcherDelay, StatusFetcherMaxAttempts, this.transactionId).fetch()
    this.status = TransferStatusDone
    return new TransferResult(transfer, transactionStatus, this.transactionId)
  }
}
