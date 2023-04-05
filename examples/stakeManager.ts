import { MCNProvider, JuneoWallet } from "../dist"
import { StakeManager, StakeReward } from "../dist/transaction/relay/stake"
import { now } from "../dist/utils"

async function main () {
    // provider to interact with the MCN
    const provider: MCNProvider = new MCNProvider()
    // recovering wallet used to sign transactions
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    // stake manager to handle staking
    const manager: StakeManager = new StakeManager(provider, wallet)
    // the node id where to delegate funds
    const nodeId: string = 'NodeID-DXGCAZFrcwfBmgXMePrTm2EU8N3s46wEq'
    // the amount to delegate
    const stakeAmount: bigint = BigInt(1000000000)
    // the time to start delegation (must be > now)
    const startTime: bigint = now() + BigInt(30)
    // the time to end the delegation with start time is staking period
    // staking period has a minimal and maximal value
    const endTime: bigint = now() + BigInt(86400 * 15)
    // try to delegate with currently available utxos in the relay chain
    manager.delegate(nodeId, stakeAmount, startTime, endTime)
    // if you want to validate instead of delegate use manager.validate instead

    // get the pending rewards for the wallet of this manager
    const pending: StakeReward[] = await manager.pendingRewards()
    // can be empty if no delegation or validation exists
    pending.forEach(reward => {
        // the type of staking (validation/delegation)
        console.log(reward.stakeType)
        // the reward of this stake
        console.log(reward.potentialReward)
        // the id of the transaction that created this stake
        console.log(reward.transactionId)
        // the asset id staked
        console.log(reward.assetId)
        console.log(reward.nodeId)
        // the amount staked of this stake
        console.log(reward.stakeAmount)
        console.log(reward.startTime)
        console.log(reward.endTime)
    })
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
