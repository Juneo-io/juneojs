import { MCNWallet, MCNProvider, Address, CreateChainTransaction, CreateSupernetTransaction,
    DynamicId, EVMAllocation, SupernetEVMGenesis, Utxo, buildCreateChainTransaction, fetchUtxos } from '../../src'

async function main() {
    const provider: MCNProvider = new MCNProvider()
    const masterWallet: MCNWallet = MCNWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    const sendersAddresses: string[] = [masterWallet.getAddress(provider.platform.chain)]
    const utxoSet: Utxo[] = await fetchUtxos(provider.platform, sendersAddresses)
    const fee: number = (await provider.getFees()).createBlockchainTxFee
    const supernetId: string = 'ZxTjijy4iNthRzuFFzMH5RS2BgJemYxwgZbzqzEhZJWqSnwhP'
    const createSupernetTx: CreateSupernetTransaction = CreateSupernetTransaction.parse((await provider.platform.getTx(supernetId)).tx)
    const chainName: string = 'Chain A'
    const vmId: DynamicId = new DynamicId('supernetevm')
    const fxIds: DynamicId[] = []
    const chainId: number = 330333
    const genesisData: string = new SupernetEVMGenesis(chainId, [
        new EVMAllocation('0x44542FD7C3F096aE54Cc07833b1C0Dcf68B7790C', BigInt("1000000000000000000000000"))
    ]).generate()
    const createChainTx: CreateChainTransaction = buildCreateChainTransaction(
        utxoSet, sendersAddresses, BigInt(fee), provider.platform.chain, supernetId,
        chainName, provider.platform.chain.assetId, vmId, fxIds, genesisData,
        createSupernetTx.getSupernetAuth(Address.toAddresses(sendersAddresses)),
        masterWallet.getAddress(provider.platform.chain), provider.mcn.id
    )
    const txId: string = (await provider.platform.issueTx(createChainTx.signTransaction([masterWallet.getWallet(provider.platform.chain)]).toCHex())).txID
    console.log(`Created chain with id: ${txId}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
