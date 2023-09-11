import dotenv from 'dotenv';
import {
    CrossOperation, ExecutableOperation, JEVMBlockchain, JVMBlockchain, JuneoWallet, MCNAccount,
    OperationSummary, MCNProvider, SocotraJUNEAssetId, SocotraJUNEChain, SocotraJVMChain
} from "../../src";
dotenv.config();


async function main () {
    const provider: MCNProvider = new MCNProvider()
    const wallet: JuneoWallet = JuneoWallet.recover(process.env.MNEMONIC ?? '')
    const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
    // the chain which we will perform the cross from
    const juneChain: JEVMBlockchain = SocotraJUNEChain
    // the chain we will perform the cross to
    const jvmChain: JVMBlockchain = SocotraJVMChain
    // we need balances to perform the operation
    await mcnAccount.fetchAllBalances()
    const assetId: string = SocotraJUNEAssetId
    const amount: bigint = BigInt('1000000000000000000') // 1 JUNE
    const address: string = wallet.getAddress(jvmChain)
    // we instantiate a cross operation that we want to perform
    const cross: CrossOperation = new CrossOperation(juneChain, jvmChain, assetId, amount, address)
    // estimate the operation
    const summary: OperationSummary = await mcnAccount.estimate(juneChain.id, cross)
    // execute the operation
    const executable: ExecutableOperation = summary.getExecutable()
    await mcnAccount.execute(summary)
    // the receipts should contain multiple transaction ids
    // that were performed to complete the cross operation
    console.log(executable.receipts)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
