import { type JEVMAPI } from '../../api'
import { type JEVMBlockchain, type TokenAsset } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { AccountError } from '../../utils'
import { TransactionType } from '../common'
import { type FeeData, type EVMFeeData } from '../fee'
import { type ExecutableMCNOperation, type MCNOperation, MCNOperationSummary, MCNOperationType } from '../operation'
import { SendManager, type SendOperation } from '../send'
import { type JEVMWallet, type JuneoWallet } from '../wallet'
import { type UnwrapOperation, WrapManager, type WrapOperation } from '../wrap'
import { AbstractAccount } from './account'

export class EVMAccount extends AbstractAccount {
  override chain: JEVMBlockchain
  api: JEVMAPI
  wallet: JuneoWallet
  chainWallet: JEVMWallet
  gasBalance: bigint = BigInt(0)
  registeredAssets: string[] = []
  private readonly wrapManager: WrapManager
  private readonly sendManager: SendManager

  constructor (provider: MCNProvider, chainId: string, wallet: JuneoWallet) {
    super(provider.jevm[chainId].chain)
    this.chain = provider.jevm[chainId].chain
    this.api = provider.jevm[chainId]
    this.wallet = wallet
    this.chainWallet = wallet.getEthWallet(this.chain)
    this.addresses.push(this.chainWallet.getHexAddress())
    this.wrapManager = new WrapManager(this.api, this.chainWallet)
    this.sendManager = new SendManager(provider, wallet)
  }

  async estimate (operation: MCNOperation): Promise<MCNOperationSummary> {
    if (operation.type === MCNOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const fee: FeeData = await this.sendManager.estimateSendEVM(this.chain.id, send.assetId, send.amount, send.address)
      return new MCNOperationSummary(operation, this.chain, [fee])
    } else if (operation.type === MCNOperationType.Wrap) {
      const wrapping: WrapOperation = operation as WrapOperation
      const fee: FeeData = await this.wrapManager.estimateWrapFee(wrapping.asset, wrapping.amount)
      return new MCNOperationSummary(operation, this.chain, [fee])
    } else if (operation.type === MCNOperationType.Unwrap) {
      const wrapping: UnwrapOperation = operation as UnwrapOperation
      const fee: FeeData = await this.wrapManager.estimateUnwrapFee(wrapping.asset, wrapping.amount)
      return new MCNOperationSummary(operation, this.chain, [fee])
    }
    throw new AccountError(`unsupported operation: ${operation.type} for the chain with id: ${this.chain.id}`)
  }

  async execute (executable: ExecutableMCNOperation): Promise<void> {
    const operation: MCNOperation = executable.summary.operation
    if (operation.type === MCNOperationType.Send) {
      const send: SendOperation = operation as SendOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionHash: string = await this.sendManager.sendEVM(this.chain.id, send.assetId, send.amount, send.address, fees[i] as EVMFeeData)
        const success: boolean = await executable.addTrackedEVMTransaction(this.api, TransactionType.Send, transactionHash).catch(error => {
          throw error
        })
        if (!success) {
          break
        }
      }
    } else if (operation.type === MCNOperationType.Wrap) {
      const wrapping: WrapOperation = operation as WrapOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionHash: string = await this.wrapManager.wrap(wrapping.asset, wrapping.amount, fees[i] as EVMFeeData)
        const success: boolean = await executable.addTrackedEVMTransaction(this.api, TransactionType.Wrap, transactionHash).catch(error => {
          throw error
        })
        if (!success) {
          break
        }
      }
    } else if (operation.type === MCNOperationType.Unwrap) {
      const wrapping: UnwrapOperation = operation as UnwrapOperation
      const fees: FeeData[] = executable.summary.fees
      for (let i = 0; i < fees.length; i++) {
        const transactionHash: string = await this.wrapManager.unwrap(wrapping.asset, wrapping.amount, fees[i] as EVMFeeData)
        const success: boolean = await executable.addTrackedEVMTransaction(this.api, TransactionType.Unwrap, transactionHash).catch(error => {
          throw error
        })
        if (!success) {
          break
        }
      }
    }
  }

  registerAssets (assets: TokenAsset[] | string[]): void {
    for (let i = 0; i < assets.length; i++) {
      const assetId: string = typeof assets[i] === 'string'
        ? assets[i] as string
        : (assets[i] as TokenAsset).assetId
      // no need to register chain asset id as it is already calculated as gas balance
      if (assetId === this.chain.assetId || this.registeredAssets.includes(assetId)) {
        continue
      }
      this.registeredAssets.push(assetId)
    }
  }

  async fetchBalances (): Promise<void> {
    await super.fetchBalancesAsynchronously(async () => {
      const address: string = this.chainWallet.getHexAddress()
      this.gasBalance = await this.chain.queryEVMBalance(this.api, address, this.chain.assetId)
      this.balances.set(this.chain.assetId, this.gasBalance)
      for (let j = 0; j < this.registeredAssets.length; j++) {
        const assetId: string = this.registeredAssets[j]
        const amount: bigint = await this.chain.queryEVMBalance(this.api, address, assetId)
        this.balances.set(assetId, amount)
      }
    })
  }
}
