import { MCNProvider, JuneoWallet, WrapManager, SocotraWJUNEContractAdapter } from "../dist"
import { WETHContractAdapter } from "../dist/solidity"

async function main () {
    // provider to interact with the MCN
    const provider: MCNProvider = new MCNProvider()
    // recovering wallet used to sign transactions
    const wallet: JuneoWallet = JuneoWallet.recover('urge cigar seminar remove curve glow force ritual yellow envelope promote glare')
    // stake manager to handle staking
    const manager: WrapManager = new WrapManager(provider, wallet)
    // the contract adapter of the asset we will wrap
    const adapter: WETHContractAdapter = SocotraWJUNEContractAdapter
    // the amount to wrap
    const wrapAmount: bigint = BigInt("1000000000000000000")
    // start the wrapping will provide a handler for it
    // which can be used to track its status
    manager.wrap(adapter, wrapAmount)
    // to unwrap you can call manager.unwrap instead with the same parameters
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
