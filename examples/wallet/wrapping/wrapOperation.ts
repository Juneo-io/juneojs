import { ExecutableMCNOperation, JEVMBlockchain, JuneoWallet, MCNAccount, MCNOperationStatus,
    MCNOperationSummary, MCNProvider, SocotraJUNEChain, SocotraWJUNEAsset, WrapOperation } from "../../../src"

async function main () {
    const provider: MCNProvider = new MCNProvider()
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    const mcnAccount: MCNAccount = MCNAccount.from(provider, wallet)
    // the chain which we will perform an action on
    const juneChain: JEVMBlockchain = SocotraJUNEChain
    // we instantiate a wrap operation that we want to perform on the chain
    const wrapOperation: WrapOperation = new WrapOperation(SocotraWJUNEAsset, BigInt("1000000000000000000"))
    // estimate the operation to get a summary
    const summary: MCNOperationSummary = await mcnAccount.estimate(juneChain.id, wrapOperation)
    // from the summary we can instantiate a new executable operation that can be used to perform it
    const executable: ExecutableMCNOperation = new ExecutableMCNOperation(summary)
    // execute the operation
    await mcnAccount.execute(executable)
    // check if the operation is successfull
    console.log(executable.status === MCNOperationStatus.Done)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})