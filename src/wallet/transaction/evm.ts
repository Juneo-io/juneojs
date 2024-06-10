import { type ethers } from 'ethers'
import { type JEVMAPI } from '../../api'
import { type JRC20Asset } from '../../asset'
import { type JEVMBlockchain, NativeAssetCallContract } from '../../chain'
import { type MCNProvider } from '../../juneo'
import { TimeUtils, TransactionError } from '../../utils'
import { type ChainNetworkOperation, ChainOperationSummary } from '../operation'
import { type JEVMWallet } from '../wallet'
import {
  DefaultDepositEstimate,
  DefaultWithdrawEstimate,
  InvalidNonceRetryDelay,
  MaxInvalidNonceAttempts
} from './constants'
import { EVMFeeData, FeeType } from './fee'
import { type BaseSpending, EVMTransactionData } from './transaction'

export async function getWalletNonce (wallet: JEVMWallet, api: JEVMAPI, synchronize: boolean): Promise<bigint> {
  if (synchronize || !wallet.synchronized) {
    wallet.synchronized = true
    // In the future may set unsync if error occurs in sync process.
    // Verify that it would not negatively impact any other logics before.
    // Not doing it now because of doubt it could fail somewhere else.
    wallet.nonce = await api.eth_getTransactionCount(wallet.getAddress(), 'pending')
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
  baseFee: bigint
): Promise<bigint> {
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

export async function estimateEVMOperation (
  provider: MCNProvider,
  chain: JEVMBlockchain,
  from: string,
  operation: ChainNetworkOperation,
  spendings: BaseSpending[],
  values: Map<string, bigint>,
  address: string,
  amount: bigint,
  data: string,
  feeType: FeeType
): Promise<ChainOperationSummary> {
  const api: JEVMAPI = provider.jevmApi[chain.id]
  const baseFee: bigint = await estimateEVMBaseFee(api)
  const fee = new EVMFeeData(
    chain,
    baseFee * BigInt(0),
    feeType,
    baseFee,
    BigInt(0),
    new EVMTransactionData(from, address, amount, data)
  )
  spendings.push(fee.spending)
  return await estimateEVMCall(api, from, address, amount, data, baseFee).then(
    (gasLimit) => {
      fee.setGasLimit(gasLimit)
      return new ChainOperationSummary(provider, operation, chain, fee, spendings, values, [])
    },
    (error) => {
      return new ChainOperationSummary(provider, operation, chain, fee, spendings, values, [error])
    }
  )
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

export async function estimateEVMWithdrawJRC20 (
  api: JEVMAPI,
  sender: string,
  jrc20: JRC20Asset,
  amount: bigint
): Promise<EVMFeeData> {
  const data = jrc20.adapter.getWithdrawData(amount)
  const baseFee = await estimateEVMBaseFee(api)
  const fee = new EVMFeeData(
    api.chain,
    baseFee * DefaultWithdrawEstimate,
    FeeType.Withdraw,
    baseFee,
    DefaultWithdrawEstimate,
    new EVMTransactionData(sender, jrc20.address, BigInt(0), data)
  )
  await estimateEVMCall(api, sender, jrc20.address, BigInt(0), data, baseFee).then(
    (gasLimit) => {
      fee.setGasLimit(gasLimit)
    },
    () => {}
  )
  return fee
}

export async function estimateEVMDepositJRC20 (
  api: JEVMAPI,
  sender: string,
  jrc20: JRC20Asset,
  amount: bigint
): Promise<EVMFeeData> {
  const data = jrc20.adapter.getDepositData(jrc20.nativeAssetId, amount)
  const baseFee = await estimateEVMBaseFee(api)
  const fee = new EVMFeeData(
    api.chain,
    baseFee * DefaultDepositEstimate,
    FeeType.Deposit,
    baseFee,
    DefaultDepositEstimate,
    new EVMTransactionData(sender, NativeAssetCallContract, BigInt(0), data)
  )
  await estimateEVMCall(api, sender, NativeAssetCallContract, BigInt(0), data, baseFee).then(
    (gasLimit) => {
      fee.setGasLimit(gasLimit)
    },
    () => {}
  )
  return fee
}
