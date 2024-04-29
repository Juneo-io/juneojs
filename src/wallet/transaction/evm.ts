import { type ethers } from 'ethers'
import { BaseFeeData, FeeType } from './fee'
import { type JEVMAPI } from '../../api'
import {
  AuctionContractAdapter,
  type JEVMBlockchain,
  NativeAssetCallContract,
  SendEtherGasLimit,
  StreamContractAdapter
} from '../../chain'
import {
  type CancelStreamOperation,
  ChainOperationSummary,
  type WithdrawStreamOperation,
  type RedeemAuctionOperation,
  type UnwrapOperation,
  type WrapOperation
} from '../operation'
import { BaseSpending } from './transaction'
import { TransactionError, sleep, isContractAddress } from '../../utils'
import { type JEVMWallet } from '../wallet'
import { type JRC20Asset } from '../../asset'
import { type MCNProvider } from '../../juneo'
import {
  DefaultTransferEstimate,
  MaxInvalidNonceAttempts,
  InvalidNonceRetryDelay,
  DefaultWrapEstimate,
  DefaultUnwrapEstimate,
  DefaultWithdrawEstimate,
  DefaultDepositEstimate,
  DefaultRedeemAuctionEstimate,
  DefaultWithdrawStreamEstimate,
  DefaultCancelStreamEstimate
} from './constants'

export class EVMTransactionData {
  from: string
  to: string
  value: bigint
  data: string

  constructor (from: string, to: string, value: bigint, data: string) {
    this.from = from
    this.to = to
    this.value = value
    this.data = data
  }
}

export class EVMFeeData extends BaseFeeData {
  gasPrice: bigint
  gasLimit: bigint
  data: EVMTransactionData

  constructor (
    chain: JEVMBlockchain,
    amount: bigint,
    type: string,
    gasPrice: bigint,
    gasLimit: bigint,
    data: EVMTransactionData
  ) {
    super(chain, amount, type)
    this.gasPrice = gasPrice
    this.gasLimit = gasLimit
    this.data = data
  }
}

export async function getWalletNonce (wallet: JEVMWallet, api: JEVMAPI, synchronize: boolean): Promise<bigint> {
  if (synchronize || !wallet.synchronized) {
    wallet.synchronized = true
    // In the future may set unsync if error occurs in sync process.
    // Verify that it would not negatively impact any other logics before.
    // Not doing it now because of doubt it could fail somewhere else.
    return await api.eth_getTransactionCount(wallet.getAddress(), 'pending')
  }
  return wallet.nonce++
}

export async function estimateEVMGasPrice (api: JEVMAPI): Promise<bigint> {
  return await api.eth_baseFee().catch(() => {
    return api.chain.baseFee
  })
}

export async function estimateEVMCall (
  api: JEVMAPI,
  from: string,
  to: string,
  value: bigint,
  data: string,
  type: FeeType,
  gasPriceAmount?: bigint
): Promise<EVMFeeData> {
  const gasPrice: bigint = typeof gasPriceAmount === 'undefined' ? await estimateEVMGasPrice(api) : gasPriceAmount
  const gasLimit: bigint = await api.chain.ethProvider.estimateGas({
    blockTag: 'pending',
    from,
    to,
    value,
    // TODO Add it as parameter
    // Warning to not use getWalletNonce() as it increments cached nonce.
    // nonce: Number(nonce),
    chainId: api.chain.chainId,
    gasPrice,
    data
  })
  const transactionData: EVMTransactionData = new EVMTransactionData(from, to, value, data)
  return new EVMFeeData(api.chain, gasPrice * gasLimit, type, gasPrice, gasLimit, transactionData)
}

export async function estimateEVMTransfer (
  provider: MCNProvider,
  wallet: JEVMWallet,
  chainId: string,
  assetId: string,
  amount: bigint,
  address: string
): Promise<EVMFeeData> {
  const api: JEVMAPI = provider.jevmApi[chainId]
  const isContract: boolean = isContractAddress(assetId)
  const from: string = wallet.getAddress()
  const to: string = isContract ? assetId : address
  const value: bigint = isContract ? BigInt(0) : amount
  const data: string = isContract
    ? await api.chain.getContractTransactionData(provider, assetId, address, amount)
    : '0x'
  const type: FeeType = FeeType.BaseFee
  const gasPrice: bigint = await estimateEVMGasPrice(api)
  if (assetId === api.chain.assetId) {
    const gasLimit: bigint = SendEtherGasLimit
    const transactionData: EVMTransactionData = new EVMTransactionData(from, to, value, data)
    return new EVMFeeData(api.chain, gasPrice * gasLimit, type, gasPrice, gasLimit, transactionData)
  }
  return await estimateEVMCall(api, from, to, value, data, type, gasPrice).catch(() => {
    const gasLimit: bigint = DefaultTransferEstimate
    const transactionData: EVMTransactionData = new EVMTransactionData(from, to, value, data)
    return new EVMFeeData(api.chain, gasPrice * gasLimit, type, gasPrice, gasLimit, transactionData)
  })
}

export async function executeEVMTransaction (
  provider: MCNProvider,
  wallet: JEVMWallet,
  feeData: EVMFeeData
): Promise<string> {
  const api: JEVMAPI = provider.jevmApi[wallet.chain.id]
  const unsignedTransaction: ethers.TransactionRequest = {
    from: wallet.address,
    to: feeData.data.to,
    value: feeData.data.value,
    nonce: Number(await getWalletNonce(wallet, api, false)),
    chainId: api.chain.chainId,
    gasLimit: feeData.gasLimit,
    gasPrice: feeData.gasPrice,
    data: feeData.data.data
  }
  for (let i = 0; i < MaxInvalidNonceAttempts; i++) {
    const transaction: string = await wallet.evmWallet.signTransaction(unsignedTransaction)
    const transactionId: string | undefined = await api.eth_sendRawTransaction(transaction).catch((error) => {
      const errorMessage: string = error.message as string
      if (errorMessage.includes('nonce') || errorMessage.includes('replacement transaction underpriced')) {
        return undefined
      }
      // Non nonce related error decrement nonce to avoid resyncing later.
      wallet.nonce--
      throw error
    })
    if (typeof transactionId === 'string') {
      return transactionId
    }
    await sleep(InvalidNonceRetryDelay)
    unsignedTransaction.nonce = Number(await getWalletNonce(wallet, api, true))
  }
  throw new TransactionError(`could not provide a valid nonce: ${wallet.nonce}`)
}

export async function estimateEVMWrapOperation (
  provider: MCNProvider,
  from: string,
  wrap: WrapOperation
): Promise<ChainOperationSummary> {
  const chain: JEVMBlockchain = wrap.chain
  const api: JEVMAPI = provider.jevmApi[chain.id]
  const data: string = wrap.asset.adapter.getDepositData()
  const type: FeeType = FeeType.Wrap
  const values = new Map<string, bigint>([[chain.assetId, wrap.amount]])
  return await estimateEVMCall(api, from, wrap.asset.address, wrap.amount, data, type).then(
    (fee) => {
      const spending: BaseSpending = new BaseSpending(chain, wrap.amount, chain.assetId)
      return new ChainOperationSummary(provider, wrap, chain, fee, [spending, fee.spending], values)
    },
    async () => {
      const gasPrice: bigint = await estimateEVMGasPrice(api)
      const fee: BaseFeeData = new BaseFeeData(chain, DefaultWrapEstimate * gasPrice, type)
      const spending: BaseSpending = new BaseSpending(chain, wrap.amount, chain.assetId)
      return new ChainOperationSummary(provider, wrap, chain, fee, [spending, fee.spending], values)
    }
  )
}

export async function estimateEVMUnwrapOperation (
  provider: MCNProvider,
  from: string,
  unwrap: UnwrapOperation
): Promise<ChainOperationSummary> {
  const chain: JEVMBlockchain = unwrap.chain
  const api: JEVMAPI = provider.jevmApi[chain.id]
  const data: string = unwrap.asset.adapter.getWithdrawData(unwrap.amount)
  const type: FeeType = FeeType.Unwrap
  const values = new Map<string, bigint>([[unwrap.asset.assetId, unwrap.amount]])
  return await estimateEVMCall(api, from, unwrap.asset.address, BigInt(0), data, type).then(
    (fee) => {
      const spending: BaseSpending = new BaseSpending(chain, unwrap.amount, unwrap.asset.assetId)
      return new ChainOperationSummary(provider, unwrap, chain, fee, [spending, fee.spending], values)
    },
    async () => {
      const gasPrice: bigint = await estimateEVMGasPrice(api)
      const fee: BaseFeeData = new BaseFeeData(chain, DefaultUnwrapEstimate * gasPrice, type)
      const spending: BaseSpending = new BaseSpending(chain, unwrap.amount, unwrap.asset.assetId)
      return new ChainOperationSummary(provider, unwrap, chain, fee, [spending, fee.spending], values)
    }
  )
}

export async function estimateEVMRedeemAuctionOperation (
  provider: MCNProvider,
  from: string,
  redeem: RedeemAuctionOperation
): Promise<ChainOperationSummary> {
  const chain: JEVMBlockchain = redeem.chain
  const api: JEVMAPI = provider.jevmApi[chain.id]
  const adapter: AuctionContractAdapter = new AuctionContractAdapter(redeem.auctionAddress)
  const data: string = adapter.getRedeemAuctionData(redeem.auctionId)
  const type: FeeType = FeeType.RedeemAuction
  return await estimateEVMCall(api, from, redeem.auctionAddress, BigInt(0), data, type).then(
    (fee) => {
      return new ChainOperationSummary(provider, redeem, chain, fee, [fee.spending], new Map<string, bigint>())
    },
    async () => {
      const gasPrice: bigint = await estimateEVMGasPrice(api)
      const fee: BaseFeeData = new BaseFeeData(chain, DefaultRedeemAuctionEstimate * gasPrice, type)
      return new ChainOperationSummary(provider, redeem, chain, fee, [fee.spending], new Map<string, bigint>())
    }
  )
}

export async function estimateEVMWithdrawStreamOperation (
  provider: MCNProvider,
  from: string,
  withdraw: WithdrawStreamOperation
): Promise<ChainOperationSummary> {
  const chain: JEVMBlockchain = withdraw.chain
  const api: JEVMAPI = provider.jevmApi[chain.id]
  const adapter: StreamContractAdapter = new StreamContractAdapter(withdraw.streamAddress)
  const data: string = adapter.getWithdrawFromStreamData(withdraw.streamId, withdraw.amount)
  const type: FeeType = FeeType.WithdrawStream
  return await estimateEVMCall(api, from, withdraw.streamAddress, BigInt(0), data, type).then(
    (fee) => {
      return new ChainOperationSummary(provider, withdraw, chain, fee, [fee.spending], new Map<string, bigint>())
    },
    async () => {
      const gasPrice: bigint = await estimateEVMGasPrice(api)
      const fee: BaseFeeData = new BaseFeeData(chain, DefaultWithdrawStreamEstimate * gasPrice, type)
      return new ChainOperationSummary(provider, withdraw, chain, fee, [fee.spending], new Map<string, bigint>())
    }
  )
}

export async function estimateEVMCancelStreamOperation (
  provider: MCNProvider,
  from: string,
  cancel: CancelStreamOperation
): Promise<ChainOperationSummary> {
  const chain: JEVMBlockchain = cancel.chain
  const api: JEVMAPI = provider.jevmApi[chain.id]
  const adapter: StreamContractAdapter = new StreamContractAdapter(cancel.streamAddress)
  const data: string = adapter.getCancelStreamData(cancel.streamId)
  const type: FeeType = FeeType.CancelStream
  return await estimateEVMCall(api, from, cancel.streamAddress, BigInt(0), data, type).then(
    (fee) => {
      return new ChainOperationSummary(provider, cancel, chain, fee, [fee.spending], new Map<string, bigint>())
    },
    async () => {
      const gasPrice: bigint = await estimateEVMGasPrice(api)
      const fee: BaseFeeData = new BaseFeeData(chain, DefaultCancelStreamEstimate * gasPrice, type)
      return new ChainOperationSummary(provider, cancel, chain, fee, [fee.spending], new Map<string, bigint>())
    }
  )
}

export async function estimateEVMWithdrawJRC20 (
  api: JEVMAPI,
  sender: string,
  jrc20: JRC20Asset,
  amount: bigint
): Promise<EVMFeeData> {
  const type: FeeType = FeeType.Withdraw
  const data: string = jrc20.adapter.getWithdrawData(amount)
  return await estimateEVMCall(api, sender, jrc20.address, BigInt(0), data, type).catch(async () => {
    const gasPrice: bigint = await estimateEVMGasPrice(api)
    const transactionData: EVMTransactionData = new EVMTransactionData(sender, jrc20.address, BigInt(0), data)
    return new EVMFeeData(
      api.chain,
      gasPrice * DefaultWithdrawEstimate,
      type,
      gasPrice,
      DefaultWithdrawEstimate,
      transactionData
    )
  })
}

export async function estimateEVMDepositJRC20 (
  api: JEVMAPI,
  sender: string,
  jrc20: JRC20Asset,
  amount: bigint
): Promise<EVMFeeData> {
  const type: FeeType = FeeType.Deposit
  const data: string = jrc20.adapter.getDepositData(jrc20.nativeAssetId, amount)
  return await estimateEVMCall(api, sender, NativeAssetCallContract, BigInt(0), data, type).catch(async () => {
    const gasPrice: bigint = await estimateEVMGasPrice(api)
    const transactionData: EVMTransactionData = new EVMTransactionData(sender, NativeAssetCallContract, BigInt(0), data)
    return new EVMFeeData(
      api.chain,
      gasPrice * DefaultDepositEstimate,
      type,
      gasPrice,
      DefaultDepositEstimate,
      transactionData
    )
  })
}
