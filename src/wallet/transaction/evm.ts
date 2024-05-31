import { ethers } from 'ethers'
import { type JEVMAPI } from '../../api'
import { type JRC20Asset } from '../../asset'
import {
  AuctionContractAdapter,
  type JEVMBlockchain,
  NativeAssetCallContract,
  SendEtherGasLimit,
  StreamContractAdapter
} from '../../chain'
import { type MCNProvider } from '../../juneo'
import { TimeUtils, TransactionError, isContractAddress } from '../../utils'
import {
  type CancelStreamOperation,
  ChainOperationSummary,
  type EthCallOperation,
  type JEVMChainOperation,
  type RedeemAuctionOperation,
  type WithdrawStreamOperation
} from '../operation'
import { type JEVMWallet } from '../wallet'
import {
  DefaultCancelStreamEstimate,
  DefaultDepositEstimate,
  DefaultRedeemAuctionEstimate,
  DefaultTransferEstimate,
  DefaultWithdrawEstimate,
  DefaultWithdrawStreamEstimate,
  InvalidNonceRetryDelay,
  MaxInvalidNonceAttempts
} from './constants'
import { BaseFeeData, FeeType } from './fee'
import { BaseSpending } from './transaction'

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
  baseFee: bigint
  gasLimit: bigint
  data: EVMTransactionData

  constructor (
    chain: JEVMBlockchain,
    amount: bigint,
    type: string,
    baseFee: bigint,
    gasLimit: bigint,
    data: EVMTransactionData
  ) {
    super(chain, amount, type)
    this.baseFee = baseFee
    this.gasLimit = gasLimit
    this.data = data
  }

  setGasLimit (gasLimit: bigint): void {
    this.amount = this.baseFee * this.gasLimit
    this.gasLimit = gasLimit
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

export async function estimateEVMBaseFee (api: JEVMAPI): Promise<bigint> {
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
  baseFeeAmount?: bigint
): Promise<bigint> {
  const baseFee: bigint = typeof baseFeeAmount === 'undefined' ? await estimateEVMBaseFee(api) : baseFeeAmount
  const gasLimit: bigint = await api.chain.ethProvider.estimateGas({
    blockTag: 'pending',
    from,
    to,
    value,
    // TODO Add it as parameter
    // Warning to not use getWalletNonce() as it increments cached nonce.
    // nonce: Number(nonce),
    chainId: api.chain.chainId,
    gasPrice: baseFee,
    data
  })
  return gasLimit
}

export async function estimateEVMOperationCall (
  provider: MCNProvider,
  from: string,
  operation: JEVMChainOperation,
  address: string,
  amount: bigint,
  data: string,
  defaultEstimate: bigint,
  feeType: FeeType
): Promise<ChainOperationSummary> {
  const chain: JEVMBlockchain = operation.chain
  const api: JEVMAPI = provider.jevmApi[chain.id]
  const values = new Map<string, bigint>([[chain.assetId, amount]])
  const baseFee: bigint = await estimateEVMBaseFee(api)
  const fee = new EVMFeeData(
    chain,
    baseFee * defaultEstimate,
    feeType,
    baseFee,
    defaultEstimate,
    new EVMTransactionData(from, address, amount, data)
  )
  const spending: BaseSpending = new BaseSpending(chain, amount, chain.assetId)
  return await estimateEVMCall(api, from, address, amount, data).then(
    (gasLimit) => {
      fee.setGasLimit(gasLimit)
      return new ChainOperationSummary(provider, operation, chain, fee, [spending, fee.spending], values, [])
    },
    (error) => {
      return new ChainOperationSummary(provider, operation, chain, fee, [spending, fee.spending], values, [error])
    }
  )
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
  const baseFee: bigint = await estimateEVMBaseFee(api)
  if (assetId === api.chain.assetId) {
    const gasLimit: bigint = SendEtherGasLimit
    const transactionData: EVMTransactionData = new EVMTransactionData(from, to, value, data)
    return new EVMFeeData(api.chain, baseFee * gasLimit, type, baseFee, gasLimit, transactionData)
  }
  return await estimateEVMCall(api, from, to, value, data, type, baseFee).catch(() => {
    const gasLimit: bigint = DefaultTransferEstimate
    const transactionData: EVMTransactionData = new EVMTransactionData(from, to, value, data)
    return new EVMFeeData(api.chain, baseFee * gasLimit, type, baseFee, gasLimit, transactionData)
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
    gasPrice: feeData.baseFee,
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
    await TimeUtils.sleep(InvalidNonceRetryDelay)
    unsignedTransaction.nonce = Number(await getWalletNonce(wallet, api, true))
  }
  throw new TransactionError(`could not provide a valid nonce: ${wallet.nonce}`)
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
      const baseFee: bigint = await estimateEVMBaseFee(api)
      const transactionData: EVMTransactionData = new EVMTransactionData(from, redeem.auctionAddress, BigInt(0), data)
      const fee: EVMFeeData = new EVMFeeData(
        chain,
        baseFee * DefaultRedeemAuctionEstimate,
        type,
        baseFee,
        DefaultRedeemAuctionEstimate,
        transactionData
      )
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
      const baseFee: bigint = await estimateEVMBaseFee(api)
      const transactionData: EVMTransactionData = new EVMTransactionData(from, withdraw.streamAddress, BigInt(0), data)
      const fee: EVMFeeData = new EVMFeeData(
        chain,
        baseFee * DefaultWithdrawStreamEstimate,
        type,
        baseFee,
        DefaultWithdrawStreamEstimate,
        transactionData
      )
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
      const baseFee: bigint = await estimateEVMBaseFee(api)
      const transactionData: EVMTransactionData = new EVMTransactionData(from, cancel.streamAddress, BigInt(0), data)
      const fee: EVMFeeData = new EVMFeeData(
        chain,
        baseFee * DefaultCancelStreamEstimate,
        type,
        baseFee,
        DefaultCancelStreamEstimate,
        transactionData
      )
      return new ChainOperationSummary(provider, cancel, chain, fee, [fee.spending], new Map<string, bigint>())
    }
  )
}

export async function estimateEthCallOperation (
  provider: MCNProvider,
  from: string,
  ethCall: EthCallOperation
): Promise<ChainOperationSummary> {
  const chain: JEVMBlockchain = ethCall.chain
  const api: JEVMAPI = provider.jevmApi[chain.id]
  const contract = new ethers.Contract(ethCall.contract, ethCall.abi, chain.ethProvider)
  const data = contract.interface.encodeFunctionData(ethCall.functionName, ethCall.values)
  const type: FeeType = FeeType.EthCall
  return await estimateEVMCall(api, from, ethCall.contract, ethCall.amount, data, type).then(
    (fee) => {
      return new ChainOperationSummary(provider, ethCall, chain, fee, [fee.spending], new Map<string, bigint>())
    },
    async () => {
      const baseFee: bigint = await estimateEVMBaseFee(api)
      const transactionData: EVMTransactionData = new EVMTransactionData(from, ethCall.contract, ethCall.amount, data)
      const fee: EVMFeeData = new EVMFeeData(
        chain,
        baseFee * DefaultCancelStreamEstimate,
        type,
        baseFee,
        DefaultCancelStreamEstimate,
        transactionData
      )
      return new ChainOperationSummary(provider, ethCall, chain, fee, [fee.spending], new Map<string, bigint>())
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
    const baseFee: bigint = await estimateEVMBaseFee(api)
    const transactionData: EVMTransactionData = new EVMTransactionData(sender, jrc20.address, BigInt(0), data)
    return new EVMFeeData(
      api.chain,
      baseFee * DefaultWithdrawEstimate,
      type,
      baseFee,
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
    const baseFee: bigint = await estimateEVMBaseFee(api)
    const transactionData: EVMTransactionData = new EVMTransactionData(sender, NativeAssetCallContract, BigInt(0), data)
    return new EVMFeeData(
      api.chain,
      baseFee * DefaultDepositEstimate,
      type,
      baseFee,
      DefaultDepositEstimate,
      transactionData
    )
  })
}
