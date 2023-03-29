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

  async calculate (userInputs: UserInput[]): Promise<TransferSummary[]> {
    const transfersInputs: Array<Record<string, UserInput[]>> = this.sortInputs(userInputs)
    const intraTransfersInputs: Record<string, UserInput[]> = transfersInputs[0]
    const interTransfersInputs: Record<string, UserInput[]> = transfersInputs[1]
    const summaries: TransferSummary[] = []
    // for now we are doing very simple calculations but with incoming features
    // this will become more complex
    for (const key in intraTransfersInputs) {
      const inputs: UserInput[] = intraTransfersInputs[key]
      const source: Blockchain = inputs[0].sourceChain
      const txFee: bigint = await source.queryFee(this.provider)
      summaries.push(new TransferSummary('Base transaction', source, txFee))
    }
    for (const key in interTransfersInputs) {
      const inputs: UserInput[] = interTransfersInputs[key]
      const source: Blockchain = inputs[0].sourceChain
      const destination: Blockchain = inputs[0].destinationChain
      // this is not enough we also need to calculate the fees of the destination
      // also this query needs to be calculated according to the tx type
      // e.g. send tx in EVM has different cost than export/import tx
      // whereas in JVM it is the same cost for import/export/base tx
      let txFee: bigint = await source.queryFee(this.provider)
      txFee += await destination.queryFee(this.provider)
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
      const intraTransfer: IntraChainTransfer = new IntraChainTransfer(
        inputs[0].sourceChain, inputs, this.wallet
      )
      const handler: ExecutableTransferHandler = new IntraChainTransferHandler()
      handlers.push(handler)
      void handler.execute(this.provider, intraTransfer)
    }
    for (const key in interTransfersInputs) {
      const inputs: UserInput[] = interTransfersInputs[key]
      const interTransfer: InterChainTransfer = new InterChainTransfer(
        inputs[0].sourceChain, inputs, this.wallet, inputs[0].destinationChain
      )
      // TODO update when inter chain is implemented
      // const handler: ExecutableTransferHandler = new InterChainTransferHandler()
      // handlers.push(handler)
      // void handler.execute(this.provider, interTransfer)
    }
    return handlers
  }

  private sortInputs (userInputs: UserInput[]): Array<Record<string, UserInput[]>> {
    if (userInputs.length < 1) {
      throw new TransferError('user inputs cannot be empty')
    }
    const intraTransfersInputs: Record<string, UserInput[]> = {}
    const interTransfersInputs: Record<string, UserInput[]> = {}
    // for now we consider that all transfers support batching
    // we will need to change that in the future as some chain
    // cannot do that and rather do parallel transactions
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
    const transaction: string = jvm.buildBaseTransaction(
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
