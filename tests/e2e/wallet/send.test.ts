import {
  AccountError,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SendOperation,
  SocotraEUROC1Chain,
  SocotraJUNEChain,
  SocotraJVMChain,
  type ExecutableOperation,
  SocotraNetwork
} from '../../../src'
import * as dotenv from 'dotenv'
dotenv.config()

describe('Send operations', () => {
  const wallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
  const provider: MCNProvider = new MCNProvider(SocotraNetwork)
  const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
  const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')
  const DONE_STATUS = 'Done'
  const DEFAULT_TIMEOUT: number = 10_000
  const juneChain = SocotraJUNEChain
  const euroChain = SocotraEUROC1Chain
  const jvmChain = SocotraJVMChain

  beforeAll(async () => {
    await mcnAccount.fetchChainsBalances()
  })

  describe('EVM send', () => {
    describe('Valid execute', () => {
      test.each([
        {
          chain: juneChain,
          assetId: juneChain.assetId,
          symbol: juneChain.asset.symbol,
          value: BigInt(1_000),
          recipient: '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26'
        },
        {
          chain: juneChain,
          assetId: '0x2d00000000000000000000000000000000000000',
          symbol: 'ETH.e',
          value: BigInt(1),
          recipient: '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26'
        },
        {
          chain: euroChain,
          assetId: euroChain.assetId,
          symbol: euroChain.asset.symbol,
          value: BigInt(10_000_000_000_000),
          recipient: '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26'
        }
      ])(
        '$#) $value $symbol in $chain.name to $recipient',
        async ({ chain, assetId, value, recipient }) => {
          const operation = new SendOperation(chain, assetId, value, recipient)
          const summary = await mcnAccount.estimate(operation)
          await mcnAccount.execute(summary)
          const executable: ExecutableOperation = summary.getExecutable()
          expect(executable.status).toEqual(DONE_STATUS)
        },
        DEFAULT_TIMEOUT
      )
    })

    describe('Invalid execute', () => {
      test.each([
        {
          description: 'Negative value',
          chain: juneChain,
          assetId: juneChain.assetId,
          symbol: juneChain.asset.symbol,
          value: BigInt(-1),
          recipient: '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26',
          expectedError: RangeError
        },
        {
          description: 'Excessive amount',
          chain: juneChain,
          assetId: juneChain.assetId,
          symbol: juneChain.asset.symbol,
          value: EXCESSIVE_AMOUNT,
          recipient: '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26',
          expectedError: AccountError
        },
        {
          description: 'Excessive amount and different assetId',
          chain: juneChain,
          assetId: euroChain.assetId,
          symbol: euroChain.asset.symbol,
          value: EXCESSIVE_AMOUNT,
          recipient: '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26',
          expectedError: AccountError
        }
      ])(
        '$#) $description $value $symbol in $chain.name to $recipient',
        async ({ chain, assetId, value, recipient, expectedError }) => {
          const operation = new SendOperation(chain, assetId, value, recipient)
          const summary = await mcnAccount.estimate(operation)
          await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError)
        },
        DEFAULT_TIMEOUT
      )
    })
  })

  describe('JVM send', () => {
    describe('Valid execute', () => {
      test.each([
        {
          chain: jvmChain,
          assetId: jvmChain.assetId,
          symbol: jvmChain.asset.symbol,
          value: BigInt(10_000_000),
          recipient: 'JVM-socotra167w40pwvlrf5eg0d9t48zj6kwkaqz2xan50pal'
        }
      ])(
        '$#) $value $symbol in $chain.name to $recipient',
        async ({ chain, assetId, value, recipient }) => {
          const operation = new SendOperation(chain, assetId, value, recipient)
          const summary = await mcnAccount.estimate(operation)
          await mcnAccount.execute(summary)
          const executable: ExecutableOperation = summary.getExecutable()
          expect(executable.status).toEqual(DONE_STATUS)
        },
        DEFAULT_TIMEOUT
      )
    })

    describe('Invalid execute', () => {
      test.each([
        {
          description: 'Excessive amount',
          chain: jvmChain,
          assetId: jvmChain.assetId,
          symbol: jvmChain.asset.symbol,
          value: EXCESSIVE_AMOUNT,
          recipient: 'JVM-socotra167w40pwvlrf5eg0d9t48zj6kwkaqz2xan50pal',
          expectedError: AccountError
        },
        {
          description: 'Zero value',
          chain: jvmChain,
          assetId: jvmChain.assetId,
          symbol: jvmChain.asset.symbol,
          value: BigInt(0),
          recipient: 'JVM-socotra167w40pwvlrf5eg0d9t48zj6kwkaqz2xan50pal',
          expectedError: TypeError
        }
      ])(
        '$#) $description $value $symbol in $chain.name to $recipient',
        async ({ chain, assetId, value, recipient, expectedError }) => {
          const operation = new SendOperation(chain, assetId, value, recipient)
          const summary = await mcnAccount.estimate(operation)
          await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError)
        },
        DEFAULT_TIMEOUT
      )
    })
  })
})
