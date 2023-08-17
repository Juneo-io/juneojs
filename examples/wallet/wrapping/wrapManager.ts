import { MCNProvider, JuneoWallet, WrapManager, WrappedAsset, SocotraWJUNEAsset, SocotraJUNEChain,
    JEVMBlockchain, TransactionReceipt, EVMTransactionStatus } from '../../../src'

async function main () {
    const provider: MCNProvider = new MCNProvider()
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    // wrap manager to handle wrapping
    let manager: WrapManager = WrapManager.from(provider, wallet, SocotraJUNEChain)
    // instantiation using api and wallet
    const chain: JEVMBlockchain = SocotraJUNEChain
    manager = new WrapManager(provider.jevm[chain.id], wallet.getEthWallet(chain))
    // the wrapped asset we will wrap
    const asset: WrappedAsset = SocotraWJUNEAsset
    // the amount to wrap
    const wrapAmount: bigint = BigInt("1000000000000000000")
    // start the wrapping
    // it returns a TransactionReceipt which has information about the status of the transaction
    const receipt: TransactionReceipt = await manager.wrap(asset, wrapAmount)
    // the transaction id of this receipt will be a transaction hash because a wrap is an EVM transaction
    console.log(receipt.transactionId)
    console.log(receipt.transactionStatus)
    // true if the transaction was accepted
    console.log(receipt.transactionStatus === EVMTransactionStatus.Success)
    // to unwrap you can call manager.unwrap instead with the same parameters
    await manager.unwrap(asset, wrapAmount)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
