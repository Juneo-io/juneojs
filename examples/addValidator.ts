import { MCNProvider, JuneoWallet } from "../dist"
import { StakeManager, Stakes } from "../dist/wallet/stake"
import { now } from "../dist/utils"

async function main () {
    // provider to interact with the MCN
    const provider: MCNProvider = new MCNProvider()
    // recovering wallet used to sign transactions
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    // stake manager to handle staking
    const manager: StakeManager = new StakeManager(provider, wallet)

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

    // get the stakes object for the wallet of this manager
    const pending: Stakes = manager.pendingRewards()
    console.log(pending)
    // can be empty if no delegation or validation exists
    // or if not all stakes have been fetched yet
    // this can be checked with pending.fetched
    pending.currentStakes.forEach(reward => {
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
    // Those are the stakes that have a start time that is in the future
    // They will start validating/delegating soon
    // Warning they are PendingReward have less fields values than StakeReward
    pending.futureStakes
    // whether all stakes have been fetched or there are some new ones that will be added
    pending.fetched
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})