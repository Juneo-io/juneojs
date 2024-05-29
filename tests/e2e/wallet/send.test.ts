import {
  AccountError,
  GenesisEUROC1Chain,
  GenesisJUNEChain,
  GenesisJVMChain,
  SendOperation,
  type ExecutableOperation
} from '../../../src'
import { ACCOUNT, DEFAULT_TIMEOUT, DONE_STATUS, EXCESSIVE_AMOUNT } from '../constants'

describe('Send operations', () => {
  const juneChain = GenesisJUNEChain
  const euroChain = GenesisEUROC1Chain
  const jvmChain = GenesisJVMChain

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
          value: BigInt('10000000000000'),
          recipient: '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26'
        }
      ])(
        '$#) $value $symbol in $chain.name to $recipient',
        async ({ chain, assetId, value, recipient }) => {
          const operation = new SendOperation(chain, assetId, value, recipient)
          const summary = await ACCOUNT.estimate(operation)
          await ACCOUNT.execute(summary)
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
          const summary = await ACCOUNT.estimate(operation)
          await expect(ACCOUNT.execute(summary)).rejects.toThrow(expectedError)
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
          const summary = await ACCOUNT.estimate(operation)
          await ACCOUNT.execute(summary)
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
          const summary = await ACCOUNT.estimate(operation)
          await expect(ACCOUNT.execute(summary)).rejects.toThrow(expectedError)
        },
        DEFAULT_TIMEOUT
      )
    })
  })
})
