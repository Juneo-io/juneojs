import {
  AccountError,
  DecodingError,
  DelegatePrimaryOperation,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  StakeError,
  StakeManager,
  TimeError,
  type ChainAccount,
  type ExecutableOperation,
  now,
  SocotraNetwork,
  JuneoClient
} from '../../../src'
import * as dotenv from 'dotenv'
dotenv.config()

const DEFAULT_TIMEOUT: number = 180_000
const ONE_DAY: bigint = BigInt(86_400)

const provider: MCNProvider = new MCNProvider(SocotraNetwork, JuneoClient.parse('http://172.232.42.69:9650'))
const wallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
const account: ChainAccount = mcnAccount.getAccount(provider.platform.chain.id)
const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')
const DONE_STATUS = 'Done'
// for now we take this nodeID. maybe in the future we can select the node Id with a function
const validNodeId = 'NodeID-P6qNB7Zk2tUirf9TvBiXxiCHxa5Hzq6sL'
let currentTime: bigint = now() + BigInt(30)
let tomorrow: bigint = currentTime + ONE_DAY

describe('Staking operations', (): void => {
  beforeAll(async () => {
    // TODO create time provider utils to manage those tests
    currentTime = now() + BigInt(30)
    tomorrow = currentTime + ONE_DAY
  })

  test.todo('operations instantiations')

  describe('DelegateOperation', () => {
    describe('Execute valid', () => {
      test.each([
        {
          nodeId: validNodeId,
          amount: BigInt(10_000_000),
          expectedStatus: DONE_STATUS,
          startTime: currentTime,
          endTime: tomorrow
        }
      ])(
        '$#) $amount tokens to delegate node id: $nodeId from $startTime to $endTime',
        async ({ nodeId, amount, expectedStatus, startTime, endTime }) => {
          const delegateOperation = new DelegatePrimaryOperation(
            provider.mcn,
            nodeId,
            amount,
            startTime,
            endTime,
            [account.address],
            1,
            [account.address],
            1
          )
          const summary = await mcnAccount.estimate(delegateOperation)
          await mcnAccount.execute(summary)
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
            provider.mcn,
            nodeId,
            amount,
            startTime,
            endTime,
            [account.address],
            1,
            [account.address],
            1
          )
          await expect(mcnAccount.estimate(delegateOperation)).rejects.toThrow(expectedError)
        },
        DEFAULT_TIMEOUT
      )
    })

    describe('Execute invalid', () => {
      test.each([
        {
          description: 'Less than min stake',
          nodeId: validNodeId,
          amount: BigInt(1),
          expectedError: StakeError,
          startTime: currentTime,
          endTime: tomorrow
        },
        {
          description: 'More than balance',
          nodeId: validNodeId,
          amount: EXCESSIVE_AMOUNT,
          expectedError: AccountError,
          startTime: currentTime,
          endTime: tomorrow
        },
        {
          description: 'End time in the past',
          nodeId: validNodeId,
          amount: BigInt(10_000_000),
          expectedError: TimeError,
          startTime: currentTime - BigInt(1_000),
          endTime: tomorrow
        },
        {
          description: 'Start time in the past',
          nodeId: validNodeId,
          amount: BigInt(10_000_000),
          expectedError: TimeError,
          startTime: currentTime - BigInt(40),
          endTime: tomorrow
        }
      ])(
        '$#) $description $amount tokens to delegate node id: $nodeId from $startTime to $endTime',
        async ({ nodeId, amount, expectedError, startTime, endTime }) => {
          const delegateOperation = new DelegatePrimaryOperation(
            provider.mcn,
            nodeId,
            amount,
            startTime,
            endTime,
            [account.address],
            1,
            [account.address],
            1
          )
          const summary = await mcnAccount.estimate(delegateOperation)
          await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError)
        },
        DEFAULT_TIMEOUT
      )
    })
  })
})

describe('StakeManager', () => {
  beforeAll(async () => {
    // TODO create time provider utils to manage those tests
    currentTime = now() + BigInt(30)
    tomorrow = currentTime + ONE_DAY
  })

  test('Estimate validation reward', () => {
    const reward = StakeManager.estimateValidationReward(BigInt('12960000'), BigInt('100000000000'))
    expect(reward).toEqual(expect.any(BigInt))
  })

  test('Verify staking values', () => {
    expect(() => {
      StakeManager.verifyStakingValues(
        BigInt(1_000),
        BigInt(2_000),
        BigInt(5_000),
        BigInt(1_633_027_200),
        BigInt(1_633_037_200),
        BigInt(3_600)
      )
    }).toThrow(StakeError)
  })
})
