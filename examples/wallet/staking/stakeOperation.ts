import { DelegateOperation, ExecutableOperation, JuneoWallet, MCNAccount, NetworkOperationStatus,
    OperationSummary, MCNProvider, PlatformBlockchain, StakingOperationSummary, ValidateOperation, now } from "../../../src"

async function main () {
    const provider: MCNProvider = new MCNProvider()
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
    // the chain which we will perform an action on
    const platformChain: PlatformBlockchain = provider.platform.chain
    // the node id where to validate funds
    const nodeId: string = 'NodeID-DXGCAZFrcwfBmgXMePrTm2EU8N3s46wEq'
    // the amount to validate
    const stakeAmount: bigint = BigInt(1000000000)
    // the time to start validate (must be > now)
    const startTime: bigint = now() + BigInt(30)
    // the time to end the validate with start time is staking period
    // staking period has a minimal and maximal value
    const endTime: bigint = now() + BigInt(86400 * 15)
    // we instantiate a validate operation that we want to perform on the chain
    const validateOperation: ValidateOperation = new ValidateOperation(nodeId, stakeAmount, startTime, endTime)
    // estimate the operation to get a summary
    const summary: OperationSummary = await mcnAccount.estimate(platformChain.id, validateOperation)
    // from the summary we can instantiate a new executable operation that can be used to perform it
    const executable: ExecutableOperation = summary.getExecutable()
    // execute the operation
    await mcnAccount.execute(executable, summary)
    // check if the operation is successfull
    console.log(executable.status === NetworkOperationStatus.Done)
    // to retrieve the potential reward from the summary we must first convert it
    // when estimating a validate or delegate operation it will always return a staking operation summary
    const validateSummary: StakingOperationSummary = summary as StakingOperationSummary
    console.log(validateSummary.potentialReward)
    // we can instantiate a delegate operation if we want to perform it instead of a validation
    const delegateOperation: DelegateOperation = new DelegateOperation(nodeId, stakeAmount, startTime, endTime)
    const delegationSummary: OperationSummary = await mcnAccount.estimate(platformChain.id, delegateOperation)
    const delegationExecutable: ExecutableOperation = delegationSummary.getExecutable()
    // execute the operation
    await mcnAccount.execute(delegationExecutable, summary)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
