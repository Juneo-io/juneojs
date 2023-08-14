import { AssetValue, BalancesFetchingStatus, ChainAccount, JEVMBlockchain, JVMBlockchain, JuneoWallet,
    MCNAccount, MCNProvider, NonceAccount, SocotraJUNEAsset, SocotraJUNEChain, SocotraWJUNEAsset, UtxoAccount } from '../../src'

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

        // if you only want one account you can instantiate it with chain accounts
        const jvmChain: JVMBlockchain = provider.jvm.chain
        const jvmAccount: UtxoAccount = new UtxoAccount(jvmChain, provider.jvm, [wallet.getAddress(jvmChain)])
        const customMasterAccount: MCNAccount = new MCNAccount([jvmAccount])
        // note that the JVM-Chain and Platform-Chain are both utxo accounts
        // and EVM chains are using nonce accounts
        const juneChain: JEVMBlockchain = SocotraJUNEChain
        const juneAccount: NonceAccount = new NonceAccount(juneChain, provider.jevm[juneChain.id], [wallet.getEthAddress(juneChain)])
        // in utxo accounts you do not need to register assets but for nonce accounts
        // if you want to keep track of the balance of ERC20 for example you need
        // to register them manually before fetching the balances using registerAssets
        // here for example we register the wrapped june to be tracked by this account
        juneAccount.registerAssets([SocotraWJUNEAsset])
        // make sure that you are registering an asset from the correct chain
        // it is not necessary to register the gas token of the chain
        // some assets may already be registered if you are using common chains
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
