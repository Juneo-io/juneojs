import { ChainAccount, JuneoWallet, MCNAccount, MCNProvider, SocotraJUNEChain, BalanceListener, BalanceUpdateEvent, SocotraJUNEAssetId } from "../../../src"

async function main () {
    const provider: MCNProvider = new MCNProvider()
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
    const juneAccount: ChainAccount = mcnAccount.getAccount(SocotraJUNEChain.id)
    // the asset id of the balance we will listen to
    const assetId: string = SocotraJUNEAssetId
    // the listener we want to use
    const listener: BalanceListener = new ExampleComponent()
    // registering the listener for balance events
    juneAccount.addBalanceListener(assetId, listener)
}

class ExampleComponent implements BalanceListener {
    onBalanceUpdateEvent (event: BalanceUpdateEvent) {
        console.log(event.previousValue + ' => ' + event.value)
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
