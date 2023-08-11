import { MCNProvider, JuneoWallet, WrapManager, WrappedAsset, SocotraWJUNEAsset } from '../../src'

async function main () {
    const provider: MCNProvider = new MCNProvider()
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    // wrap manager to handle wrapping
    const manager: WrapManager = new WrapManager(provider, wallet)
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
