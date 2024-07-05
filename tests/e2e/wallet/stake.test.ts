import {
  AccountError,
  DecodingError,
  DelegatePrimaryOperation,
  TimeUtils,
  type ChainAccount,
  type ExecutableOperation
} from '../../../src'
import { ACCOUNT, DEFAULT_TIMEOUT, DONE_STATUS, EXCESSIVE_AMOUNT, PROVIDER } from '../constants'

const chainAccount: ChainAccount = ACCOUNT.getAccount(PROVIDER.platformChain.id)
// for now we take this nodeID. maybe in the future we can select the node Id with a function
const validNodeId = 'NodeID-4JfgcoMWBpxCQL5VmyQ1f6L36mUbLLBga'

describe('Staking operations', (): void => {
  test.todo('operations instantiations')

  describe('DelegateOperation', () => {
    describe('Execute valid', () => {
      test.each([
        {
          nodeId: validNodeId,
          amount: BigInt(100_000_000), // 0.1 JUNE
          expectedStatus: DONE_STATUS,
          stakePeriod: TimeUtils.week() * BigInt(2)
        }
      ])(
        '$#) $amount tokens to delegate node id: $nodeId stake period of $stakePeriod',
        async ({ nodeId, amount, expectedStatus, stakePeriod }) => {
          const delegateOperation = new DelegatePrimaryOperation(
            PROVIDER.platformChain,
            nodeId,
            amount,
            stakePeriod,
            [chainAccount.address],
            1,
            [chainAccount.address],
            1
          )
          const summary = await ACCOUNT.estimate(delegateOperation)
          await ACCOUNT.execute(summary)
          const executable: ExecutableOperation = summary.getExecutable()
          expect(executable.status).toEqual(expectedStatus)
        },
        DEFAULT_TIMEOUT
      )
    })

    describe('Estimate invalid', () => {
      test.each([
        {
          description: 'Wrong node id',
          nodeId: 'WRONG_NODE_ID',
          amount: BigInt(10_000_000),
          expectedError: DecodingError,
          stakePeriod: TimeUtils.day()
        }
      ])(
        '$#) $description $amount tokens to delegate node id: $nodeId stake period of $stakePeriod',
        async ({ nodeId, amount, expectedError, stakePeriod }) => {
          const delegateOperation = new DelegatePrimaryOperation(
            PROVIDER.platformChain,
            nodeId,
            amount,
            stakePeriod,
            [chainAccount.address],
            1,
            [chainAccount.address],
            1
          )
          await expect(ACCOUNT.estimate(delegateOperation)).rejects.toThrow(expectedError)
        },
        DEFAULT_TIMEOUT
      )
    })

    describe('Execute invalid', () => {
      test.each([
        {
          description: 'More than balance',
          nodeId: validNodeId,
          amount: EXCESSIVE_AMOUNT,
          expectedError: AccountError,
          stakePeriod: TimeUtils.day()
        }
      ])(
        '$#) $description $amount tokens to delegate node id: $nodeId stake period of $stakePeriod',
        async ({ nodeId, amount, expectedError, stakePeriod }) => {
          const delegateOperation = new DelegatePrimaryOperation(
            PROVIDER.platformChain,
            nodeId,
            amount,
            stakePeriod,
            [chainAccount.address],
            1,
            [chainAccount.address],
            1
          )
          const summary = await ACCOUNT.estimate(delegateOperation)
          await expect(ACCOUNT.execute(summary)).rejects.toThrow(expectedError)
        },
        DEFAULT_TIMEOUT
      )
    })
  })
})
