import dotenv from 'dotenv';
import {
    CrossOperation, ExecutableMCNOperation,
    JVMBlockchain, JuneoWallet, MCNAccount,
    MCNOperationSummary, MCNProvider, PlatformBlockchain, SocotraJUNEAssetId,
    SocotraJVMChain, SocotraPlatformChain
} from "../../src";
dotenv.config();


async function main () {
    const provider: MCNProvider = new MCNProvider()
    const wallet: JuneoWallet = JuneoWallet.recover(process.env.MNEMONIC ?? '')
    const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
    // the chain which we will perform the cross from
    const pChain: PlatformBlockchain = SocotraPlatformChain
    // the chain we will perform the cross to
    const jvmChain: JVMBlockchain = SocotraJVMChain
    // we need balances to perform the operation
    await mcnAccount.fetchAllBalances()
    const assetId: string = SocotraJUNEAssetId
    const amount: bigint = BigInt(1_000_000_000) // 1 JUNE
    const address: string = wallet.getAddress(jvmChain)
    // we instantiate a cross operation that we want to perform
    const cross: CrossOperation = new CrossOperation(jvmChain, pChain, assetId, amount, address)
    // estimate the operation
    const summary: MCNOperationSummary = await mcnAccount.estimate(jvmChain.id, cross)
    // execute the operation
    const executable: ExecutableMCNOperation = summary.getExecutable()
    await mcnAccount.execute(executable)
    // the receipts should contain multiple transaction ids
    // that were performed to complete the cross operation
    console.log(executable.receipts)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
