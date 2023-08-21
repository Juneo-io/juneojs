import { MCNProvider, JuneoWallet, StakeManager, now, FeeData, fetchUtxos, Utxo } from '../../../src'

async function main () {
    const provider: MCNProvider = new MCNProvider()
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    // stake manager to handle staking
    let manager: StakeManager = StakeManager.from(provider, wallet)
    // instantiation using vm wallet
    manager = new StakeManager(provider, wallet.getWallet(provider.platform.chain))
    // the node id where to delegate funds
    const nodeId: string = 'NodeID-DXGCAZFrcwfBmgXMePrTm2EU8N3s46wEq'
    // the amount to delegate
    const stakeAmount: bigint = BigInt(1000000000)
    // the time to start delegation (must be > now)
    const startTime: bigint = now() + BigInt(30)
    // the time to end the delegation with start time is staking period
    // staking period has a minimal and maximal value
    const endTime: bigint = now() + BigInt(86400 * 15)
    // estimating the fee
    const fee: FeeData = await manager.estimateDelegationFee()
    // we can display those fee and optionnaly use them to execute the staking
    // it returns the id of the transaction that was created
    // try to delegate with currently available utxos in the relay chain
    const transasctionId: string = await manager.delegate(nodeId, stakeAmount, startTime, endTime, fee)
    // if you want to validate instead of delegate use manager.validate
    // here the fee is not estimated before and used to call the unwrap function
    // so it will estimate it internally
    await manager.validate(nodeId, stakeAmount, startTime, endTime)
    // for even more advanced usage you can optionally provide the utxo set that will be used
    // to build the transaction and are thus available to consumption
    // here we fetch all utxos of the address of the wallet used to instantiate the stake manager
    // so it will be able to sign each consumed utxo properly
    const utxos: Utxo[] = await fetchUtxos(provider.platform, [wallet.getAddress(provider.platform.chain)])
    const validateFee: FeeData = await manager.estimateValidationFee()
    await manager.validate(nodeId, stakeAmount, startTime, endTime, validateFee, utxos)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
