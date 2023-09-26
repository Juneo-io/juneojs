import { MCNProvider, MCNWallet, StakeManager, now } from '../../src'

async function main () {
    // provider to interact with the MCN
    const provider: MCNProvider = new MCNProvider()
    // recovering wallet used to sign transactions
    const wallet: MCNWallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
    // stake manager to handle staking
    const manager: StakeManager = StakeManager.from(provider, wallet)

    // the node id which will validate the funds
    const nodeId: string = 'NodeID-DXGCAZFrcwfBmgXMePrTm2EU8N3s46wEq'
    // the amount to validate
    const stakeAmount: bigint = BigInt(100 * (10**9)) // 100 JUNE
    // the time to start delegation (must be > now)
    const startTime: bigint = now() + BigInt(30)
    // the time to end the validation with start time is staking period
    // staking period has a minimal and maximal value
    const endTime: bigint = now() + BigInt(86400 * 15)
    // try to validate with currently available utxos in the relay chain
    manager.validate(nodeId, stakeAmount, startTime, endTime)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
