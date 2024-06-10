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
const ONE_DAY: bigint = BigInt(86_400)
let currentTime: bigint = TimeUtils.now() + BigInt(30)
let tomorrow: bigint = currentTime + ONE_DAY

describe('Staking operations', (): void => {
  beforeAll(async () => {
    // TODO create time provider utils to manage those tests
    currentTime = TimeUtils.now() + BigInt(30)
    tomorrow = currentTime + ONE_DAY
  })

  test.todo('operations instantiations')

  describe('DelegateOperation', () => {
    describe('Execute valid', () => {
      test.each([
        {
          nodeId: validNodeId,
          amount: BigInt(1_000_000),
          expectedStatus: DONE_STATUS,
          startTime: currentTime,
          endTime: tomorrow
        }
      ])(
        '$#) $amount tokens to delegate node id: $nodeId from $startTime to $endTime',
        async ({ nodeId, amount, expectedStatus, startTime, endTime }) => {
          const delegateOperation = new DelegatePrimaryOperation(
            PROVIDER.platformChain,
            nodeId,
            amount,
            startTime,
            endTime,
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
          startTime: currentTime,
          endTime: tomorrow
        }
      ])(
        '$#) $description $amount tokens to delegate node id: $nodeId from $startTime to $endTime',
        async ({ nodeId, amount, expectedError, startTime, endTime }) => {
          const delegateOperation = new DelegatePrimaryOperation(
            PROVIDER.platformChain,
            nodeId,
            amount,
            startTime,
            endTime,
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
          startTime: currentTime,
          endTime: tomorrow
        }
      ])(
        '$#) $description $amount tokens to delegate node id: $nodeId from $startTime to $endTime',
        async ({ nodeId, amount, expectedError, startTime, endTime }) => {
          const delegateOperation = new DelegatePrimaryOperation(
            PROVIDER.platformChain,
            nodeId,
            amount,
            startTime,
            endTime,
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
