import { type Blockchain, JVM_ID, RELAYVM_ID } from '../chain'
import { type MCNProvider } from '../juneo'
import { FeeError } from '../utils'

export class FeeData {
  chain: Blockchain
  assetId: string
  amount: bigint

  constructor (chain: Blockchain, assetId: string, amount: bigint) {
    this.chain = chain
    this.assetId = assetId
    this.amount = amount
  }
}

export class FeeManager {
  private static singleton: FeeManager
  adapters: Record<string, FeeQueryAdapter> = {}

  private constructor () {
    this.adapters[RELAYVM_ID] = new RelayVMFeeQueryAdapter()
    this.adapters[JVM_ID] = new JVMFeeQueryAdapter()
  }

  private static getSingleton (): FeeManager {
    if (FeeManager.singleton === undefined) {
      FeeManager.singleton = new FeeManager()
    }
    return FeeManager.singleton
  }

  static registerAdapter (vmId: string, adapter: FeeQueryAdapter): void {
    const manager: FeeManager = FeeManager.getSingleton()
    if (manager.adapters[vmId] !== undefined) {
      throw new FeeError(`an adapter is already registered for vm id: ${vmId}`)
    }
    manager.adapters[vmId] = adapter
  }

  static async calculate (provider: MCNProvider, source: Blockchain, destination: Blockchain): Promise<bigint> {
    const manager: FeeManager = FeeManager.getSingleton()
    const sourceAdapter: FeeQueryAdapter = manager.adapters[source.vmId]
    if (sourceAdapter === undefined) {
      throw new FeeError(`there is no adapter registered for vm id: ${source.vmId}`)
    }
    // intra chain transfer
    if (source.id === destination.id) {
      return await sourceAdapter.queryBaseFee(provider)
    }
    const destinationAdapter: FeeQueryAdapter = manager.adapters[destination.vmId]
    if (destinationAdapter === undefined) {
      throw new FeeError(`there is no adapter registered for vm id: ${destination.vmId}`)
    }
    // inter chain transfer (currently only cross chain transactions)
    const exportFee: bigint = await sourceAdapter.queryExportFee(provider)
    const importFee: bigint = await destinationAdapter.queryImportFee(provider)
    return exportFee + importFee
  }
}

export interface FeeQueryAdapter {

  queryBaseFee: (provider: MCNProvider) => Promise<bigint>

  queryExportFee: (provider: MCNProvider) => Promise<bigint>

  queryImportFee: (provider: MCNProvider) => Promise<bigint>

}

class RelayVMFeeQueryAdapter implements FeeQueryAdapter {
  async queryBaseFee (provider: MCNProvider): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }

  async queryExportFee (provider: MCNProvider): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }

  async queryImportFee (provider: MCNProvider): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }
}

class JVMFeeQueryAdapter implements FeeQueryAdapter {
  async queryBaseFee (provider: MCNProvider): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }

  async queryExportFee (provider: MCNProvider): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }

  async queryImportFee (provider: MCNProvider): Promise<bigint> {
    return BigInt((await provider.getFees()).txFee)
  }
}
