import * as dotenv from 'dotenv'
import {
  type ChainAccount,
  DelegateOperation,
  type ExecutableOperation,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SocotraPlatformChain,
  StakeManager,
  ValidateOperation
} from '../../src'
dotenv.config()

describe('StakeManager', (): void => {
  const wallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
  const provider: MCNProvider = new MCNProvider()
  const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
  const account: ChainAccount = mcnAccount.getAccount(SocotraPlatformChain.id)

  // for now we take this nodeID. maybe in the future we can select the node Id with a function
  const nodeId = 'NodeID-P6qNB7Zk2tUirf9TvBiXxiCHxa5Hzq6sL'
  const currentDateInSeconds = Math.round(new Date().getTime() / 1000)
  const currentDateToBigint = BigInt(currentDateInSeconds) + BigInt(30)
  const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')
  const DONE_STATUS = 'Done'

  // fetch all balances before tests
  beforeEach(async () => {
    await account.fetchAllChainBalances()
  })

  describe('Valid Operations', () => {
    test('Should estimate validation fee', async () => {
      // valid
      const stakeManager = new StakeManager(provider, wallet.getWallet(provider.platform.chain))
      const feeData = await stakeManager.estimateValidationFee(
        nodeId,
        BigInt(100000000),
        currentDateToBigint,
        currentDateToBigint + BigInt(86400)
      )
      expect(feeData.chain).toEqual(SocotraPlatformChain)
      expect(feeData.amount).toEqual(BigInt(0))
    })

    test('Should make a delegate transaction', async () => {
      // valid
      const delegateOperation = new DelegateOperation(
        provider.mcn,
        nodeId,
        BigInt(10000000), // 0.01 JUNE
        currentDateToBigint,
        currentDateToBigint + BigInt(86400) // 1 day
      )

      const summary = await mcnAccount.estimate(delegateOperation)
      const executable: ExecutableOperation = summary.getExecutable()

      await mcnAccount.execute(summary)
      expect(executable.status).toEqual(DONE_STATUS)
    })

    test('Should correctly estimate validation reward', () => {
      // valid
      const reward = StakeManager.estimateValidationReward(BigInt(12960000), BigInt(100000000000))
      expect(reward).toEqual(expect.any(BigInt))
    })
  })

  describe('Invalid Operations', () => {
    test('Should not make a delegate transaction with amount less than min stake', async () => {
      // invalid
      const delegateOperation = new DelegateOperation(
        provider.mcn,
        nodeId,
        BigInt(1),
        currentDateToBigint,
        currentDateToBigint + BigInt(86400) // 1 day
      )

      const summary = await mcnAccount.estimate(delegateOperation)
      await expect(mcnAccount.execute(summary)).rejects.toThrow('amount 1 is less than min stake 10000000')
    })

    test('Should not make a delegate transaction with amount bigger than balance', async () => {
      // invalid
      const delegateOperation = new DelegateOperation(
        provider.mcn,
        nodeId,
        EXCESSIVE_AMOUNT,
        currentDateToBigint,
        currentDateToBigint + BigInt(86400) // 1 day
      )

      const summary = await mcnAccount.estimate(delegateOperation)
      await expect(mcnAccount.execute(summary)).rejects.toThrow('missing funds to perform operation: Delegate')
    })

    test('Should not make a delegate transaction with wrong nodeId', async () => {
      // invalid
      const delegateOperation = new DelegateOperation(
        provider.mcn,
        'P6qNB7Zk2tUirf9TvBiXxiCHxa5Hzq6sG',
        BigInt(10000000),
        currentDateToBigint,
        currentDateToBigint + BigInt(86400) // 1 day
      )

      await expect(mcnAccount.estimate(delegateOperation)).rejects.toThrow('value checksum is not valid')
    })

    test('Should not make a delegate transaction with wrong nodeId', async () => {
      // invalid
      const delegateOperation = new DelegateOperation(
        provider.mcn,
        'wrong node id',
        BigInt(10000000),
        currentDateToBigint,
        currentDateToBigint + BigInt(86400) // 1 day
      )

      await expect(mcnAccount.estimate(delegateOperation)).rejects.toThrow('value is not base58')
    })

    test('Should not make a delegate transaction with wrong end time', async () => {
      // invalid
      const delegateOperation = new DelegateOperation(
        provider.mcn,
        nodeId,
        BigInt(10000000),
        currentDateToBigint,
        currentDateToBigint - BigInt(10) // 1 day
      )

      const summary = await mcnAccount.estimate(delegateOperation)
      await expect(mcnAccount.execute(summary)).rejects.toThrow('end time must be after start time')
    })

    test('Should not make a delegate transaction with wrong start time', async () => {
      // invalid
      const delegateOperation = new DelegateOperation(
        provider.mcn,
        nodeId,
        BigInt(10000000),
        currentDateToBigint - BigInt(40),
        currentDateToBigint + BigInt(86400) // 1 day
      )

      const summary = await mcnAccount.estimate(delegateOperation)
      await expect(mcnAccount.execute(summary)).rejects.toThrow('start time must be in the future')
    })

    test('Should throw an error for invalid staking values', () => {
      // invalid
      expect(() => {
        StakeManager.verifyStakingValues(
          BigInt(1000),
          BigInt(2000),
          BigInt(5000),
          BigInt(1633027200),
          BigInt(1633037200),
          BigInt(3600)
        )
      }).toThrow()
    })

    test('Should not make a validate transaction with amount less than min stake', async () => {
      // invalid
      const validateOperation = new ValidateOperation(
        provider.mcn,
        nodeId,
        BigInt(1),
        currentDateToBigint,
        currentDateToBigint + BigInt(86400) // 1 day
      )

      const summary = await mcnAccount.estimate(validateOperation)
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        `amount 1 is less than min stake ${provider.mcn.stakeConfig.minValidatorStake}`
      )
    })

    test('Should not make a validate transaction with wrong nodeId', async () => {
      // invalid
      const validateOperation = new ValidateOperation(
        provider.mcn,
        'wrong node id',
        BigInt(10000000),
        currentDateToBigint,
        currentDateToBigint + BigInt(86400) // 1 day
      )

      await expect(mcnAccount.estimate(validateOperation)).rejects.toThrow('value is not base58')
    })

    test('Should not make a duplicate validate transaction', async () => {
      // invalid
      const validateOperation = new ValidateOperation(
        provider.mcn,
        nodeId,
        BigInt(1000000000),
        currentDateToBigint,
        currentDateToBigint + BigInt(86400) // 1 day
      )

      const summary = await mcnAccount.estimate(validateOperation)
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "couldn't issue tx: attempted to issue duplicate validation for NodeID-P6qNB7Zk2tUirf9TvBiXxiCHxa5Hzq6sL"
      )
    })
  })
})
