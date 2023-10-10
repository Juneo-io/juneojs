import * as dotenv from 'dotenv'
import {
  AccountError,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SocotraBCH1Chain,
  SocotraJUNEChain,
  SocotraWJUNEAsset,
  UnwrapOperation,
  WrapOperation,
  type ExecutableOperation
} from '../../src'
dotenv.config()

describe('Wrapping and Unwrapping Operations', () => {
  const wallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
  const provider: MCNProvider = new MCNProvider()
  const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
  const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')
  const DONE_STATUS = 'Done'

  beforeAll(async () => {
    mcnAccount.getAccount(SocotraBCH1Chain.id)
  })

  beforeEach(async () => {
    await mcnAccount.fetchChainsBalances()
  })

  describe('WrapOperation', () => {
    describe('Instanciation', () => {
      test.each([
        ['WrapOperation instance', SocotraJUNEChain, SocotraWJUNEAsset, BigInt(1000)]
      ])('%s', async (description, blockchain, asset, amount) => {
        const operation = new WrapOperation(blockchain, asset, amount)

        expect(operation.chain).toEqual(blockchain)
        expect(operation.asset).toEqual(asset)
        expect(operation.amount).toEqual(amount)
      })
    })

    describe('Valid WrapOperation', () => {
      test.each([
        ['Wrap operation correctly', SocotraJUNEChain, SocotraWJUNEAsset, BigInt(1000), DONE_STATUS]
      ])('%s', async (description, blockchain, asset, amount, expectedStatus) => {
        const operation = new WrapOperation(blockchain, asset, amount)
        const summary = await mcnAccount.estimate(operation)
        const executable: ExecutableOperation = summary.getExecutable()

        await mcnAccount.execute(summary)
        expect(executable.status).toEqual(expectedStatus)
      }, 10000)
    })

    describe('Invalid WrapOperation', () => {
      test.each([
        ['Wrap more than the available balance', SocotraJUNEChain, SocotraWJUNEAsset, EXCESSIVE_AMOUNT, AccountError],
        ['Wrap operation with amount 0', SocotraJUNEChain, SocotraWJUNEAsset, BigInt(0), AccountError]
      ])('%s', async (description, blockchain, asset, amount, expectedStatus) => {
        const operation = new WrapOperation(blockchain, asset, amount)
        const summary = await mcnAccount.estimate(operation)

        await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedStatus)
      }, 10000)
    })
  })

  describe('UnwrapOperation', () => {
    describe('Instanciation', () => {
      test.each([
        ['UnwrapOperation instance', SocotraJUNEChain, SocotraWJUNEAsset, BigInt(1000)]
      ])('%s', async (description, blockchain, asset, amount) => {
        const operation = new UnwrapOperation(blockchain, asset, amount)

        expect(operation.chain).toEqual(blockchain)
        expect(operation.asset).toEqual(asset)
        expect(operation.amount).toEqual(amount)
      })
    })

    describe('Valid UnwrapOperation', () => {
      test.each([
        ['Unwrap operation correctly', SocotraJUNEChain, SocotraWJUNEAsset, BigInt(1000), DONE_STATUS]
      ])('%s', async (description, blockchain, asset, amount, expectedStatus) => {
        const operation = new UnwrapOperation(blockchain, asset, amount)
        const summary = await mcnAccount.estimate(operation)
        const executable: ExecutableOperation = summary.getExecutable()

        await mcnAccount.execute(summary)
        expect(executable.status).toEqual(expectedStatus)
      }, 15000)
    })

    describe('Invalid UnwrapOperation', () => {
      test.each([
        ['Unwrap more than the available wrapped balance', SocotraJUNEChain, SocotraWJUNEAsset, EXCESSIVE_AMOUNT, AccountError]
      ])('%s', async (description, blockchain, asset, amount, expectedError) => {
        const operation = new UnwrapOperation(blockchain, asset, amount)
        const summary = await mcnAccount.estimate(operation)

        await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError)
      }, 10000)
    })
  })
})
