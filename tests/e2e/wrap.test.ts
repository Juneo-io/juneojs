import {
  AccountError,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SocotraJUNEChain,
  SocotraWJUNEAsset,
  UnwrapOperation,
  WrapOperation,
  type ExecutableOperation,
  NetworkOperationRange,
  NetworkOperationType,
  SocotraNetwork
} from '../../src'
import * as dotenv from 'dotenv'
dotenv.config()

describe('Wrapping operations', () => {
  const wallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
  const provider: MCNProvider = new MCNProvider(SocotraNetwork)
  const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
  const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')
  const DONE_STATUS = 'Done'
  const DEFAULT_TIMEOUT: number = 10_000
  const juneChain = SocotraJUNEChain
  const wJuneAsset = SocotraWJUNEAsset

  beforeEach(async () => {
    await mcnAccount.fetchChainsBalances()
  })

  describe('WrapOperation', () => {
    describe('Instantiation', () => {
      test.each([{ blockchain: juneChain, asset: wJuneAsset, amount: BigInt(1000) }])(
        '$#) $amount $asset.name in $blockchain.name',
        async ({ blockchain, asset, amount }) => {
          const operation = new WrapOperation(blockchain, asset, amount)
          expect(operation.chain).toEqual(blockchain)
          expect(operation.asset).toEqual(asset)
          expect(operation.amount).toEqual(amount)
          expect(operation.range).toEqual(NetworkOperationRange.Chain)
          expect(operation.type).toEqual(NetworkOperationType.Wrap)
        }
      )
    })

    describe('Valid wrap', () => {
      test.each([{ blockchain: juneChain, asset: wJuneAsset, amount: BigInt(1000), expectedStatus: DONE_STATUS }])(
        '$#) $amount $asset.name in $blockchain.name',
        async ({ blockchain, asset, amount, expectedStatus }) => {
          const operation = new WrapOperation(blockchain, asset, amount)
          const summary = await mcnAccount.estimate(operation)
          await mcnAccount.execute(summary)
          const executable: ExecutableOperation = summary.getExecutable()
          expect(executable.status).toEqual(expectedStatus)
        },
        DEFAULT_TIMEOUT
      )
    })

    describe('Invalid wrap', () => {
      test.each([
        {
          description: 'More than available balance',
          blockchain: juneChain,
          asset: wJuneAsset,
          amount: EXCESSIVE_AMOUNT,
          expectedStatus: AccountError
        },
        {
          description: 'Zero amount',
          blockchain: juneChain,
          asset: wJuneAsset,
          amount: BigInt(0),
          expectedStatus: AccountError
        }
      ])(
        '$#) $description $amount $asset.name in $blockchain.name',
        async ({ blockchain, asset, amount, expectedStatus }) => {
          const operation = new WrapOperation(blockchain, asset, amount)
          const summary = await mcnAccount.estimate(operation)
          await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedStatus)
        },
        DEFAULT_TIMEOUT
      )
    })
  })

  describe('UnwrapOperation', () => {
    describe('Instantiation', () => {
      test.each([{ blockchain: juneChain, asset: wJuneAsset, amount: BigInt(1000) }])(
        '$#) $amount $asset.name in $blockchain.name',
        async ({ blockchain, asset, amount }) => {
          const operation = new UnwrapOperation(blockchain, asset, amount)
          expect(operation.chain).toEqual(blockchain)
          expect(operation.asset).toEqual(asset)
          expect(operation.amount).toEqual(amount)
          expect(operation.range).toEqual(NetworkOperationRange.Chain)
          expect(operation.type).toEqual(NetworkOperationType.Unwrap)
        }
      )
    })

    describe('Valid unwrap', () => {
      test.each([{ blockchain: juneChain, asset: wJuneAsset, amount: BigInt(1000), expectedStatus: DONE_STATUS }])(
        '$#) $amount $asset.name in $blockchain.name',
        async ({ blockchain, asset, amount, expectedStatus }) => {
          const operation = new UnwrapOperation(blockchain, asset, amount)
          const summary = await mcnAccount.estimate(operation)
          await mcnAccount.execute(summary)
          const executable: ExecutableOperation = summary.getExecutable()
          expect(executable.status).toEqual(expectedStatus)
        },
        DEFAULT_TIMEOUT
      )
    })

    describe('Invalid unwrap', () => {
      test.each([
        {
          description: 'More than available wrapped balance',
          blockchain: juneChain,
          asset: wJuneAsset,
          amount: EXCESSIVE_AMOUNT,
          expectedError: AccountError
        }
      ])(
        '$#) $description $amount $asset.name in $blockchain.name',
        async ({ blockchain, asset, amount, expectedError }) => {
          const operation = new UnwrapOperation(blockchain, asset, amount)
          const summary = await mcnAccount.estimate(operation)
          await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError)
        },
        DEFAULT_TIMEOUT
      )
    })
  })
})
