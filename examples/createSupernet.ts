import { JuneoWallet, MCNProvider, juneojs } from "../dist"
import { CreateSupernetTransaction, Utxo, buildCreateSupernetTransaction, parseUtxoSet } from "../dist/transaction"

async function main() {
    const provider: MCNProvider = new MCNProvider()
    const masterWallet: JuneoWallet = juneojs.JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    const sendersAddresses: string[] = [masterWallet.getAddress(provider.platform.chain)]
    const utxoSet: Utxo[] = parseUtxoSet(await provider.platform.getUTXOs(sendersAddresses))
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
