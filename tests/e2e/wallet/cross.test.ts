import {
  AccountError,
  CrossOperation,
  InputError,
  NetworkOperationRange,
  NetworkOperationType,
  SocotraEUR1Chain,
  SocotraJUNEChain,
  SocotraJVMChain,
  SocotraPlatformChain,
  type ExecutableOperation
} from '../../../src'
import { ACCOUNT, DEFAULT_TIMEOUT, DONE_STATUS, EXCESSIVE_AMOUNT } from '../constants'

describe('Cross operations', () => {
  const juneChain = SocotraJUNEChain
  const euroChain = SocotraEUR1Chain
  const platformChain = SocotraPlatformChain
  const jvmChain = SocotraJVMChain
  const euroAddress = '0x3000000000000000000000000000000000000000'

  describe('Instantiation', () => {
    test.each([
      {
        source: juneChain,
        destination: euroChain,
        assetId: euroAddress,
        symbol: 'EUROC.e',
        value: BigInt(1_000)
      },
      {
        source: euroChain,
        destination: juneChain,
        assetId: euroChain.assetId,
        symbol: euroChain.asset.symbol,
        value: BigInt('10000000000000')
      },
      {
        source: juneChain,
        destination: jvmChain,
        assetId: juneChain.assetId,
        symbol: juneChain.asset.symbol,
        value: BigInt('100000000000')
      },
      {
        source: juneChain,
        destination: euroChain,
        assetId: euroChain.assetId,
        symbol: euroChain.asset.symbol,
        value: BigInt(5_000)
      },
      {
        source: juneChain,
        destination: platformChain,
        assetId: '0x4400000000000000000000000000000000000000',
        symbol: 'UNDEFINED',
        value: BigInt(6_000)
      },
      {
        source: juneChain,
        destination: euroChain,
        assetId: euroAddress,
        symbol: 'EUROC.e',
        value: EXCESSIVE_AMOUNT
      },
      {
        source: juneChain,
        destination: euroChain,
        assetId: euroAddress,
        symbol: 'EUROC.e',
        value: BigInt(0)
      },
      {
        source: juneChain,
        destination: euroChain,
        assetId: euroAddress,
        symbol: 'EUROC.e',
        value: BigInt(-1_000)
      }
    ])(
      '$#) $value $symbol from $source.name to $destination.name',
      async ({ source, destination, assetId, value }) => {
        const operation = new CrossOperation(source, destination, assetId, value)
        expect(operation.amount).toEqual(value)
        expect(operation.assetId).toEqual(assetId)
        expect(operation.destination).toEqual(destination)
        expect(operation.source).toEqual(source)
        expect(operation.range).toEqual(NetworkOperationRange.Supernet)
        expect(operation.type).toEqual(NetworkOperationType.Cross)
      },
      DEFAULT_TIMEOUT
    )
  })

  describe('Valid execute', () => {
    test.each([
      {
        source: juneChain,
        destination: euroChain,
        assetId: euroAddress,
        symbol: 'EUROC.e',
        value: BigInt(1_000)
      },
      {
        source: euroChain,
        destination: juneChain,
        assetId: euroChain.assetId,
        symbol: euroChain.asset.symbol,
        value: BigInt('10000000000000')
      },
      {
        source: juneChain,
        destination: jvmChain,
        assetId: juneChain.assetId,
        symbol: juneChain.asset.symbol,
        value: BigInt('100000000000')
      },
      {
        source: juneChain,
        destination: platformChain,
        assetId: juneChain.assetId,
        symbol: juneChain.asset.symbol,
        value: BigInt('1000000000000')
      },
      {
        source: platformChain,
        destination: juneChain,
        assetId: platformChain.assetId,
        symbol: platformChain.asset.symbol,
        value: BigInt(1_000_000)
      },
      {
        source: platformChain,
        destination: jvmChain,
        assetId: platformChain.assetId,
        symbol: platformChain.asset.symbol,
        value: BigInt(1_000_000)
      },
      {
        source: jvmChain,
        destination: platformChain,
        assetId: jvmChain.assetId,
        symbol: jvmChain.asset.symbol,
        value: BigInt(1_000_000)
      },
      {
        source: jvmChain,
        destination: juneChain,
        assetId: jvmChain.assetId,
        symbol: jvmChain.asset.symbol,
        value: BigInt(1_000_000)
      }
    ])(
      '$#) $value $symbol from $source.name to $destination.name',
      async ({ source, destination, assetId, value }) => {
        const operation = new CrossOperation(source, destination, assetId, value)
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
        source: juneChain,
        destination: euroChain,
        assetId: euroAddress,
        symbol: 'EUROC.e',
        value: BigInt(-1),
        expectedError: InputError
      },
      {
        source: juneChain,
        destination: euroChain,
        assetId: euroAddress,
        symbol: 'EUROC.e',
        value: EXCESSIVE_AMOUNT,
        expectedError: AccountError
      },
      {
        source: juneChain,
        destination: euroChain,
        assetId: euroChain.assetId,
        symbol: euroChain.asset.symbol,
        value: EXCESSIVE_AMOUNT,
        expectedError: AccountError
      },
      {
        source: juneChain,
        destination: jvmChain,
        assetId: juneChain.assetId,
        symbol: juneChain.asset.symbol,
        value: BigInt(0),
        expectedError: InputError
      },
      {
        source: juneChain,
        destination: platformChain,
        assetId: juneChain.assetId,
        symbol: juneChain.asset.symbol,
        value: BigInt(0),
        expectedError: InputError
      },
      {
        source: jvmChain,
        destination: juneChain,
        assetId: jvmChain.assetId,
        symbol: jvmChain.asset.symbol,
        value: BigInt(0),
        expectedError: InputError
      },
      {
        source: jvmChain,
        destination: platformChain,
        assetId: jvmChain.assetId,
        symbol: jvmChain.asset.symbol,
        value: BigInt(0),
        expectedError: InputError
      },
      {
        source: platformChain,
        destination: juneChain,
        assetId: platformChain.assetId,
        symbol: platformChain.asset.symbol,
        value: BigInt(0),
        expectedError: InputError
      },
      {
        source: platformChain,
        destination: jvmChain,
        assetId: platformChain.assetId,
        symbol: platformChain.asset.symbol,
        value: BigInt(0),
        expectedError: InputError
      }
    ])(
      '$#) $value $symbol from $source.name to $destination.name',
      async ({ source, destination, assetId, value, expectedError }) => {
        const operation = new CrossOperation(source, destination, assetId, value)
        const summary = await ACCOUNT.estimate(operation)
        await expect(ACCOUNT.execute(summary)).rejects.toThrow(expectedError)
      },
      DEFAULT_TIMEOUT
    )
  })
})
