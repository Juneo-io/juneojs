import { MCNProvider, JuneoWallet, WrapManager, WrappedAsset, SocotraWJUNEAsset, SocotraJUNEChain,
    JEVMBlockchain, EVMFeeData } from '../../../src'

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
    // estimating the fee
    const fee: EVMFeeData = await manager.estimateWrapFee(asset, wrapAmount)
    // we can display those fee and optionnaly use them to execute the wrap
    // it returns the hash of the transaction that was created
    const transactionHash: string = await manager.wrap(asset, wrapAmount, fee)
    // to unwrap you can call manager.unwrap instead with the same parameters
    // here the fee is not estimated before and used to call the unwrap function
    // so it will estimate it internally and consume an unknown amount of gas
    await manager.unwrap(asset, wrapAmount)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
