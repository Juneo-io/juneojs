import { ExecutableOperation, JEVMBlockchain, JuneoWallet, MCNAccount, NetworkOperationStatus,
    OperationSummary, MCNProvider, SocotraJUNEChain, SocotraWJUNEAsset, WrapOperation } from "../../../src"

async function main () {
    const provider: MCNProvider = new MCNProvider()
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
    // the chain which we will perform an action on
    const juneChain: JEVMBlockchain = SocotraJUNEChain
    // we instantiate a wrap operation that we want to perform on the chain
    const wrapOperation: WrapOperation = new WrapOperation(SocotraWJUNEAsset, BigInt("1000000000000000000"))
    // estimate returns a summary of the operation that contains data about it such as the fees to pay
    // note that if you try to estimate an operation which is not compatible with the chain
    // an error will be thrown. If you try to do an operation on a chain which is not
    // registered in the MCNAccount you will also encounter an error
    const summary: OperationSummary = await mcnAccount.estimate(juneChain.id, wrapOperation)
    console.log(summary.fees)
    // from the summary we can get the executable operation that will be used to perform it
    const executable: ExecutableOperation = summary.getExecutable()
    await mcnAccount.execute(summary)
    // the executable has fields that can help keeping track of the current state of the operation
    console.log(executable.status === NetworkOperationStatus.Done)
    // a list of the current receipts created by the operation is also available
    console.log(executable.receipts)
    // once a finished status is set there should be no newer receipts into it
    // MCNOperationStatus.Done indicates that the executable successfully achieved all transactions
    // MCNOperationStatus.Error indicates that an error occured on one of the transactions and it stopped the operation
    // MCNOperationStatus.Timeout indicates that the executable stopped its execution because it was too long

    // because in this example we are doing a wrap operation which is pretty simple
    // there should be no more than one receipt into it but for more complex operations
    // there could be more transactions that are sent
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
