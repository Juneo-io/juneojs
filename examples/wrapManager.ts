import { MCNProvider, JuneoWallet, WrapManager, WrappedAsset, SocotraWJUNEAsset } from "../dist"

async function main () {
    // provider to interact with the MCN
    const provider: MCNProvider = new MCNProvider()
    // recovering wallet used to sign transactions
    const wallet: JuneoWallet = JuneoWallet.recover('urge cigar seminar remove curve glow force ritual yellow envelope promote glare')
    // stake manager to handle staking
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
