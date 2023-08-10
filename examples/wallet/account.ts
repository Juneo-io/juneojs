import { AssetValue, BalancesFetchingStatus, ChainAccount, JuneoWallet, MCNAccount, MCNProvider, SocotraJUNEAsset } from '../../src'

async function main () {
    const provider: MCNProvider = new MCNProvider()
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    // create a MCNAccount from the provider with the default chains balances
    const mcnAccount: MCNAccount = MCNAccount.from(provider, wallet)
    for (let i = 0; i < mcnAccount.balances.length; i++) {
        const account: ChainAccount = mcnAccount.balances[i]
        // we can fetch the balances synchronously or asynchronously
        // in that case each chain account has a status to track if
        // it is done fetching or not
        await account.fetchBalances()
        // this should always be true if used synchronously
        console.log(account.status === BalancesFetchingStatus.Done)
        // the returned balance will be an AssetValue which contains useful methods
        const balance: AssetValue = account.getBalance(SocotraJUNEAsset)
        // this is the value that must be used to create transactions
        console.log(balance.value)
        // this value is human friendly and shows all the decimals
        console.log(balance.getReadableValue())
        // this value is rounded down up to 2 decimals
        console.log(balance.getReadableValueRounded())
        // this value is rounded down up to 6 decimals
        console.log(balance.getReadableValueRounded(6))
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
