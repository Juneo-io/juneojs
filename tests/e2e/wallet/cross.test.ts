import {
  AccountError,
  CrossOperation,
  InputError,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SocotraEUROC1Chain,
  SocotraJUNEChain,
  SocotraJVMChain,
  SocotraPlatformChain,
  type ExecutableOperation,
  SocotraNetwork,
  NetworkOperationRange,
  NetworkOperationType
} from '../../../src'
import * as dotenv from 'dotenv'
dotenv.config()

describe('Cross operations', () => {
  const wallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
  const provider: MCNProvider = new MCNProvider(SocotraNetwork)
  const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
  const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')
  const DEFAULT_TIMEOUT: number = 10_000
  const DONE_STATUS = 'Done'
  const juneChain = SocotraJUNEChain
  const euroChain = SocotraEUROC1Chain
  const platformChain = SocotraPlatformChain
  const jvmChain = SocotraJVMChain

  beforeEach(async () => {
    await mcnAccount.fetchChainsBalances()
  })

  describe('Instantiation', () => {
    test.each([
      {
        source: juneChain,
        destination: euroChain,
        assetId: '0x3300000000000000000000000000000000000000',
        symbol: 'EUROC.e',
        value: BigInt(1_000)
      },
      {
        source: euroChain,
        destination: juneChain,
        assetId: euroChain.assetId,
        symbol: euroChain.asset.symbol,
        value: BigInt(10_000_000_000_000)
      },
      {
        source: juneChain,
        destination: jvmChain,
        assetId: juneChain.assetId,
        symbol: juneChain.asset.symbol,
        value: BigInt(100_000_000_000)
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
        assetId: '0x3300000000000000000000000000000000000000',
        symbol: 'EUROC.e',
        value: EXCESSIVE_AMOUNT
      },
      {
        source: juneChain,
        destination: euroChain,
        assetId: '0x3300000000000000000000000000000000000000',
        symbol: 'EUROC.e',
        value: BigInt(0)
      },
      {
        source: juneChain,
        destination: euroChain,
        assetId: '0x3300000000000000000000000000000000000000',
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
        assetId: '0x3300000000000000000000000000000000000000',
        symbol: 'EUROC.e',
        value: BigInt(1_000)
      },
      {
        source: euroChain,
        destination: juneChain,
        assetId: euroChain.assetId,
        symbol: euroChain.asset.symbol,
        value: BigInt(10_000_000_000_000)
      },
      {
        source: juneChain,
        destination: jvmChain,
        assetId: juneChain.assetId,
        symbol: juneChain.asset.symbol,
        value: BigInt(100_000_000_000)
      },
      {
        source: juneChain,
        destination: platformChain,
        assetId: juneChain.assetId,
        symbol: juneChain.asset.symbol,
        value: BigInt(1_000_000_000_000)
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
        source: juneChain,
        destination: euroChain,
        assetId: '0x3300000000000000000000000000000000000000',
        symbol: 'EUROC.e',
        value: BigInt(-1),
        expectedError: InputError
      },
      {
        source: juneChain,
        destination: euroChain,
        assetId: '0x3300000000000000000000000000000000000000',
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
        const summary = await mcnAccount.estimate(operation)
        await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError)
      },
      DEFAULT_TIMEOUT
    )
  })
})
