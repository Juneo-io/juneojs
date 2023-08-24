import { type Blockchain, JEVM_ID, type JEVMBlockchain, isCrossable, type Crossable, type JVMBlockchain, type AssetValue } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { type UserInput } from '../../transaction'
import { FeeError } from '../../utils'
import { Spending } from './transaction'
import { type JuneoWallet, type JEVMWallet } from '../wallet'

export enum FeeType {
  Undefined = 'Undefined',
  BaseFee = 'Base fee',
  ExportFee = 'Export fee',
  ImportFee = 'Import fee',
  Wrap = 'Wrap fee',
  Unwrap = 'Unwrap fee',
  ValidateFee = 'Validate fee',
  DelegateFee = 'Delegate fee'
}

export class FeeData extends Spending {
  chain: Blockchain
  type: string

  constructor (chain: Blockchain, amount: bigint, type: string) {
    super(chain.id, amount, chain.assetId)
    this.chain = chain
    this.type = type
  }

  getAssetValue (): AssetValue {
    return this.chain.asset.getAssetValue(this.amount)
  }
}

export async function calculateFee (provider: MCNProvider, wallet: JuneoWallet, source: Blockchain, destination: Blockchain, inputs: UserInput[]): Promise<FeeData[]> {
  if (source.id === destination.id) {
    return await calculateIntraChainTransferFee(provider, wallet, source, inputs)
  }
  return await calculateInterChainTransferFee(provider, wallet, source, destination, inputs)
}

async function calculateIntraChainTransferFee (provider: MCNProvider, wallet: JuneoWallet, chain: Blockchain, inputs: UserInput[]): Promise<FeeData[]> {
  let txFee: bigint = await chain.queryBaseFee(provider)
  if (chain.vmId === JEVM_ID) {
    let gasTxFee: bigint = BigInt(0)
    for (let i: number = 0; i < inputs.length; i++) {
      const input: UserInput = inputs[i]
      const hexAddress: string = (wallet.getWallet(chain) as JEVMWallet).getHexAddress()
      gasTxFee += txFee * await (chain as JEVMBlockchain).estimateGasLimit(input.assetId, hexAddress, input.address, input.amount)
    }
    txFee = gasTxFee
  }
  return [new FeeData(chain, txFee, FeeType.BaseFee)]
}

async function calculateInterChainTransferFee (provider: MCNProvider, wallet: JuneoWallet, source: Blockchain, destination: Blockchain, inputs: UserInput[]): Promise<FeeData[]> {
  if (!isCrossable(source) || !isCrossable(destination)) {
    throw new FeeError('both chains must implement Crossable to do inter chain transfer')
  }
  const sourceChain: Blockchain & Crossable = inputs[0].sourceChain as unknown as Blockchain & Crossable
  const destinationChain: Blockchain & Crossable = inputs[0].destinationChain as unknown as Blockchain & Crossable
  const fees: FeeData[] = []
  const exportFee: bigint = await sourceChain.queryExportFee(provider, inputs, destination.assetId)
  fees.push(new FeeData(source, exportFee, FeeType.ExportFee))
  const requiresProxy: boolean = source.vmId === JEVM_ID && destination.vmId === JEVM_ID
  if (requiresProxy) {
    const jvmChain: JVMBlockchain = provider.jvm.chain
    fees.push(new FeeData(jvmChain, await jvmChain.queryImportFee(provider), FeeType.ImportFee))
    fees.push(new FeeData(jvmChain, await jvmChain.queryExportFee(provider), FeeType.ExportFee))
  }
  const importFee: bigint = await destinationChain.queryImportFee(provider, inputs)
  fees.push(new FeeData(destination, importFee, FeeType.ImportFee))
  return fees
}
