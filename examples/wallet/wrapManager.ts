import { MCNProvider, JuneoWallet, WrapManager, WrappedAsset, SocotraWJUNEAsset, SocotraJUNEChain, JEVMBlockchain } from '../../src'

async function main () {
    const provider: MCNProvider = new MCNProvider()
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    // wrap manager to handle wrapping
    let manager: WrapManager = WrapManager.from(provider, wallet, SocotraJUNEChain)
    // instantiation using api and account
    const chain: JEVMBlockchain = SocotraJUNEChain
    manager = new WrapManager(provider.jevm[chain.id], wallet.getEthWallet(chain))
    // the wrapped asset we will wrap
    const asset: WrappedAsset = SocotraWJUNEAsset
    // the amount to wrap
    const wrapAmount: bigint = BigInt("1000000000000000000")
    // start the wrapping will provide a handler for it
    // which can be used to track its status
    manager.wrap(asset, wrapAmount)
    // to unwrap you can call manager.unwrap instead with the same parameters
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
