import { JVM_ID, PLATFORMVM_ID, JEVM_ID, type Blockchain, type Crossable } from '../chain'
import { type MCNProvider } from '../juneo'
import { CrossError } from '../utils'
import { type MCNOperation, MCNOperationType } from './operation'
import { type JuneoWallet } from './wallet'

export class CrossManager {
  private readonly provider: MCNProvider
  private readonly wallet: JuneoWallet

  constructor (provider: MCNProvider, wallet: JuneoWallet) {
    this.provider = provider
    this.wallet = wallet
  }

  verifyCrossOperation (operation: CrossOperation): void {
    if (operation.source.id === operation.destination.id) {
      throw new CrossError('source and destination chain cannot be the same')
    }
    const sourceVmId: string = operation.source.vmId
    if (sourceVmId !== JVM_ID || sourceVmId !== PLATFORMVM_ID || sourceVmId !== JEVM_ID) {
      throw new CrossError('source vm id does not support cross')
    }
    const destinationVmId: string = operation.destination.vmId
    if (destinationVmId !== JVM_ID || destinationVmId !== PLATFORMVM_ID || destinationVmId !== JEVM_ID) {
      throw new CrossError('destination vm id does not support cross')
    }
  }
}

export class CrossOperation implements MCNOperation {
  type: MCNOperationType = MCNOperationType.Cross
  source: Blockchain & Crossable
  destination: Blockchain & Crossable
  assetId: string
  amount: bigint
  address: string

  constructor (source: Blockchain & Crossable, destination: Blockchain & Crossable, assetId: string, amount: bigint, address: string) {
    this.source = source
    this.destination = destination
    this.assetId = assetId
    this.amount = amount
    this.address = address
  }
}
