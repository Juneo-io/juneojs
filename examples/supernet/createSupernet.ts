import { MCNWallet, MCNProvider, CreateSupernetTransaction, Utxo,
    buildCreateSupernetTransaction, fetchUtxos } from '../../src'

async function main() {
    const provider: MCNProvider = new MCNProvider()
    const masterWallet: MCNWallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
    const sendersAddresses: string[] = [masterWallet.getAddress(provider.platform.chain)]
    const utxoSet: Utxo[] = await fetchUtxos(provider.platform, sendersAddresses)
    const fee: number = (await provider.getFees()).createSupernetTxFee
    const createSupernetTx: CreateSupernetTransaction = buildCreateSupernetTransaction(
        utxoSet, sendersAddresses, BigInt(fee), provider.platform.chain,
        sendersAddresses, sendersAddresses.length, masterWallet.getAddress(provider.platform.chain), provider.mcn.id
    )
    const txId: string = (await provider.platform.issueTx(createSupernetTx.signTransaction([masterWallet.getWallet(provider.platform.chain)]).toCHex())).txID
    console.log(`Created supernet with id: ${txId}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
