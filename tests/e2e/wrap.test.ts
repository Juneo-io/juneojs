import * as dotenv from 'dotenv'
import {
  type Blockchain,
  type ChainAccount,
  type EVMAccount,
  type ExecutableOperation,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SocotraBCH1Chain,
  SocotraJUNEChain,
  SocotraWJUNEAsset,
  UnwrapOperation,
  WrapOperation,
  type WrappedAsset
} from '../../src'
dotenv.config()

describe('Wrapping and Unwrapping Operations', () => {
  let mockBlockchain: Blockchain
  let mockAsset: WrappedAsset
  let mockAmount: bigint
  const wallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
  const provider: MCNProvider = new MCNProvider()
  const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
  const account: ChainAccount = mcnAccount.getAccount(SocotraJUNEChain.id)
  const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')
  const DONE_STATUS = 'Done'

  // fetch all balances before tests
  beforeAll(async () => {
    await (account as EVMAccount).fetchAllChainBalances()
    mcnAccount.getAccount(SocotraBCH1Chain.id)
    await mcnAccount.fetchChainsBalances()
  })

  beforeEach(() => {
    mockBlockchain = SocotraJUNEChain
    mockAsset = SocotraWJUNEAsset
    mockAmount = BigInt(1000)
  })

  describe('Valid Operations', () => {
    test('should correctly create a WrapOperation instance', async () => {
      // valid
      const operation = new WrapOperation(mockBlockchain, mockAsset, mockAmount)

      expect(operation.chain).toEqual(mockBlockchain)
      expect(operation.asset).toEqual(mockAsset)
      expect(operation.amount).toEqual(mockAmount)
    })

    test('should perform the wrap operation correctly', async () => {
      // valid
      const operation = new WrapOperation(mockBlockchain, mockAsset, mockAmount)

      const summary = await mcnAccount.estimate(operation)
      const executable: ExecutableOperation = summary.getExecutable()

      await mcnAccount.execute(summary)
      expect(executable.status).toEqual(DONE_STATUS)
    }, 10000)

    test('should correctly create an UnwrapOperation instance', async () => {
      // valid
      const operation = new UnwrapOperation(mockBlockchain, mockAsset, mockAmount)

      expect(operation.chain).toEqual(mockBlockchain)
      expect(operation.asset).toEqual(mockAsset)
      expect(operation.amount).toEqual(mockAmount)
    })

    test('should perform the unwrap operation correctly', async () => {
      // valid
      const operation = new UnwrapOperation(mockBlockchain, mockAsset, mockAmount)

      const summary = await mcnAccount.estimate(operation)
      const executable: ExecutableOperation = summary.getExecutable()

      await mcnAccount.execute(summary)
      expect(executable.status).toEqual(DONE_STATUS)
    }, 15000)
  })

  describe('Invalid Operations', () => {
    test('should not wrap more than the available balance', async () => {
      // invalid
      const operation = new WrapOperation(mockBlockchain, mockAsset, EXCESSIVE_AMOUNT)

      const summary = await mcnAccount.estimate(operation)
      await expect(mcnAccount.execute(summary)).rejects.toThrow('missing funds to perform operation: Wrap')
    }, 10000)

    test('should not unwrap more than the available wrapped balance', async () => {
      // invalid
      const operation = new UnwrapOperation(mockBlockchain, mockAsset, EXCESSIVE_AMOUNT)

      const summary = await mcnAccount.estimate(operation)
      await expect(mcnAccount.execute(summary)).rejects.toThrow('missing funds to perform operation: Unwrap')
    }, 10000)

    test('should not perform the wrap operation with amount 0', async () => {
      // invalid
      const operation = new WrapOperation(mockBlockchain, mockAsset, BigInt(0))

      const summary = await mcnAccount.estimate(operation)
      const executable: ExecutableOperation = summary.getExecutable()

      await mcnAccount.execute(summary)
      expect(executable.status).toEqual(DONE_STATUS)
    }, 10000)
  })
})