import * as dotenv from 'dotenv'
import {
  AccountError,
  DecodingError,
  DelegateOperation,
  JsonRpcError,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SocotraPlatformChain,
  StakeError,
  StakeManager,
  TimeError,
  ValidateOperation,
  type ChainAccount,
  type ExecutableOperation
} from '../../src'
dotenv.config()

describe('Stake', (): void => {
  const wallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
  const provider: MCNProvider = new MCNProvider()
  const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
  const account: ChainAccount = mcnAccount.getAccount(SocotraPlatformChain.id)

  // for now we take this nodeID. maybe in the future we can select the node Id with a function
  const nodeId = 'NodeID-P6qNB7Zk2tUirf9TvBiXxiCHxa5Hzq6sL'

  const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')
  const DONE_STATUS = 'Done'
  const currentDateInSeconds = Math.round(new Date().getTime() / 1000)
  const currentDateToBigint = BigInt(currentDateInSeconds) + BigInt(30)
  const oneDayInSeconds = currentDateToBigint + BigInt(86400)

  // fetch all balances before tests
  beforeEach(async () => {
    await account.fetchAllChainBalances()
  })

  describe('ValidateOperation', () => {
    describe('Invalid estimate Operations', () => {
      test.each([
        ['Wrong nodeId', 'wrong node id', BigInt(10000000), DecodingError]
      ])('%s', async (description, nodeId, amount, expectedError) => {
        const validateOperation = new ValidateOperation(
          provider.mcn,
          nodeId,
          amount,
          currentDateToBigint,
          oneDayInSeconds
        )
        await expect(mcnAccount.estimate(validateOperation)).rejects.toThrow(expectedError)
      })
    })

    describe('Invalid execute Operations', () => {
      test.each([
        ['Amount less than min stake', nodeId, BigInt(1), StakeError],
        ['Duplicate validate transaction', nodeId, BigInt(1000000000), JsonRpcError]
      ])('%s', async (description, nodeId, amount, expectedError) => {
        const validateOperation = new ValidateOperation(
          provider.mcn,
          nodeId,
          amount,
          currentDateToBigint,
          oneDayInSeconds
        )
        const summary = await mcnAccount.estimate(validateOperation)
        await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError)
      })
    })
  })

  describe('DelegateOperation', () => {
    describe('Valid Operations', () => {
      test.each([
        ['Delegate transaction', nodeId, BigInt(10000000), DONE_STATUS]
      ])('%s', async (description, nodeId, amount, expectedStatus) => {
        const delegateOperation = new DelegateOperation(
          provider.mcn,
          nodeId,
          amount,
          currentDateToBigint,
          oneDayInSeconds
        )
        const summary = await mcnAccount.estimate(delegateOperation)
        const executable: ExecutableOperation = summary.getExecutable()

        await mcnAccount.execute(summary)
        expect(executable.status).toEqual(expectedStatus)
      })
    })

    describe('Invalid estimate Operations', () => {
      test.each([
        ['Wrong nodeId checksum', 'P6qNB7Zk2tUirf9TvBiXxiCHxa5Hzq6sG', BigInt(10000000), DecodingError],
        ['Wrong nodeId format', 'wrong node id', BigInt(10000000), DecodingError]
      ])('%s', async (description, nodeId, amount, expectedError) => {
        const delegateOperation = new DelegateOperation(
          provider.mcn,
          nodeId,
          amount,
          currentDateToBigint,
          oneDayInSeconds
        )
        await expect(mcnAccount.estimate(delegateOperation)).rejects.toThrow(expectedError)
      })
    })

    describe('Invalid execute Operations', () => {
      test.each([
        ['Amount less than min stake', nodeId, BigInt(1), StakeError],
        ['Amount bigger than balance', nodeId, EXCESSIVE_AMOUNT, AccountError],
        ['Wrong end time', nodeId, BigInt(10000000), TimeError, BigInt(currentDateToBigint) - BigInt(1000)],
        ['Wrong start time', nodeId, BigInt(10000000), TimeError, BigInt(currentDateToBigint) - BigInt(40), oneDayInSeconds]
      ])('%s', async (description, nodeId, amount, expectedError, startTime = currentDateToBigint, endTime = oneDayInSeconds) => {
        const delegateOperation = new DelegateOperation(
          provider.mcn,
          nodeId,
          amount,
          startTime,
          endTime
        )
        const summary = await mcnAccount.estimate(delegateOperation)
        await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError)
      })
    })
  })

  describe('StakeManager', () => {
    test('Estimate validation fee', async () => {
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

    test('Estimate validation reward', () => {
      const reward = StakeManager.estimateValidationReward(BigInt(12960000), BigInt(100000000000))
      expect(reward).toEqual(expect.any(BigInt))
    })

    test('Invalid staking values', () => {
      expect(() => {
        StakeManager.verifyStakingValues(
          BigInt(1000),
          BigInt(2000),
          BigInt(5000),
          BigInt(1633027200),
          BigInt(1633037200),
          BigInt(3600)
        )
      }).toThrow(StakeError)
    })
  })
})
