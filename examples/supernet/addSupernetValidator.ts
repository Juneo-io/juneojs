import dotenv from 'dotenv';
import {
    AddSupernetValidatorTransaction, Address, CreateSupernetTransaction,
    JuneoWallet,
    MCNProvider,
    NodeId, SupernetId, Utxo, buildAddSupernetValidatorTransaction,
    fetchUtxos,
    now
} from '../../src';

dotenv.config();
async function main() {
    const provider: MCNProvider = new MCNProvider()
    const masterWallet: JuneoWallet = JuneoWallet.recover(process.env.MNEMONIC ?? '')
    const sendersAddresses: string[] = [masterWallet.getAddress(provider.platform.chain)]
    const utxoSet: Utxo[] = await fetchUtxos(provider.platform, sendersAddresses)
    const fee: number = (await provider.getFees()).addSupernetValidatorFee
    const nodeId: string = 'NodeID-B2GHMQ8GF6FyrvmPUX6miaGeuVLH9UwHr'
    const startTime: bigint = now() + BigInt(30)
    const endTime: bigint = startTime + BigInt(3600 * 24 * 14 + 30)
    const weight: bigint = BigInt(100)
    const supernetId: string = 'ZxTjijy4iNthRzuFFzMH5RS2BgJemYxwgZbzqzEhZJWqSnwhP'
    const createSupernetTx: CreateSupernetTransaction = CreateSupernetTransaction.parse((await provider.platform.getTx(supernetId)).tx)
    const addSupernetValidatorTx: AddSupernetValidatorTransaction = buildAddSupernetValidatorTransaction(
        utxoSet, sendersAddresses, BigInt(fee), provider.platform.chain,
        new NodeId(nodeId), startTime, endTime, weight, new SupernetId(supernetId), createSupernetTx.getSupernetAuth(Address.toAddresses(sendersAddresses)),
        masterWallet.getAddress(provider.platform.chain), provider.mcn.id
    )
    const txId: string = (await provider.platform.issueTx(addSupernetValidatorTx.signTransaction([masterWallet.getWallet(provider.platform.chain)]).toCHex())).txID
    console.log(txId)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
