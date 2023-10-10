import * as dotenv from 'dotenv'
import {
  AccountError,
  CrossOperation,
  InputError,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SocotraEUROC1AssetId,
  SocotraEUROC1Chain,
  SocotraJUNEAssetId,
  SocotraJUNEChain,
  SocotraJVMChain,
  SocotraPlatformChain,
  type Blockchain,
  type ExecutableOperation
} from '../../src'
dotenv.config()

describe('Cross Operations', () => {
  const wallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
  const provider: MCNProvider = new MCNProvider()
  const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)

  const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')

  // fetch all balances before tests
  beforeAll(async () => {
    mcnAccount.getAccount(SocotraEUROC1Chain.id)
    mcnAccount.getAccount(SocotraJVMChain.id)
    mcnAccount.getAccount(SocotraPlatformChain.id)
  })

  beforeEach(async () => {
    await mcnAccount.fetchChainsBalances()
  })
  describe('Instanciation', () => {
    const validTestCases = [
      [SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', BigInt(1000)],
      [SocotraEUROC1Chain, SocotraJUNEChain, SocotraEUROC1AssetId, BigInt(10000000000000)],
      [SocotraJUNEChain, SocotraJVMChain, SocotraJUNEAssetId, BigInt(100000000000)],
      [SocotraJUNEChain, SocotraEUROC1Chain, SocotraEUROC1AssetId, BigInt(5000)],
      [SocotraJUNEChain, SocotraPlatformChain, '0x4400000000000000000000000000000000000000', BigInt(6000)],
      [SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', EXCESSIVE_AMOUNT],
      [SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', BigInt(0)],
      [SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', BigInt(-1000)]
    ]

    validTestCases.forEach(([src, dest, assetId, value]) => {
      test(`Source ${(src as Blockchain).name}, destination ${(dest as Blockchain).name}`, async () => {
        const operation = new CrossOperation(src as Blockchain, dest as Blockchain, assetId as string, value as bigint)
        expect(operation.source).toEqual(src)
        expect(operation.assetId).toEqual(assetId)
      })
    })
  })

  describe('Valid CrossOperation', () => {
    const testCases = [
      [SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', BigInt(1000)],
      [SocotraEUROC1Chain, SocotraJUNEChain, SocotraEUROC1AssetId, BigInt(10000000000000)],
      [SocotraJUNEChain, SocotraJVMChain, SocotraJUNEAssetId, BigInt(100000000000)],
      [SocotraJUNEChain, SocotraPlatformChain, SocotraJUNEAssetId, BigInt(1000000000000)],
      [SocotraPlatformChain, SocotraJUNEChain, SocotraJUNEAssetId, BigInt(1000000)],
      [SocotraPlatformChain, SocotraJVMChain, SocotraJUNEAssetId, BigInt(1000000)],
      [SocotraJVMChain, SocotraPlatformChain, SocotraJUNEAssetId, BigInt(1000000)],
      [SocotraJVMChain, SocotraJUNEChain, SocotraJUNEAssetId, BigInt(1000000)]
    ]

    testCases.forEach(([src, dest, assetId, value]) => {
      test(`From ${(src as Blockchain).name} to ${(dest as Blockchain).name}`, async () => {
        const operation = new CrossOperation(src as Blockchain, dest as Blockchain, assetId as string, value as bigint)
        const summary = await mcnAccount.estimate(operation)
        const executable: ExecutableOperation = summary.getExecutable()

        await mcnAccount.execute(summary)
        expect(executable.status).toEqual('Done')
      }, 15000)
    })
  })

  describe('Invalid Operations', () => {
    const testCases = [
      [SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', BigInt(-1), InputError],
      [SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', EXCESSIVE_AMOUNT, AccountError],
      [SocotraJUNEChain, SocotraEUROC1Chain, SocotraEUROC1AssetId, EXCESSIVE_AMOUNT, AccountError],
      [SocotraJUNEChain, SocotraJVMChain, SocotraJUNEAssetId, BigInt(0), InputError],
      [SocotraJUNEChain, SocotraPlatformChain, SocotraJUNEAssetId, BigInt(0), InputError],
      [SocotraJVMChain, SocotraJUNEChain, SocotraJUNEAssetId, BigInt(0), InputError],
      [SocotraJVMChain, SocotraPlatformChain, SocotraJUNEAssetId, BigInt(0), InputError],
      [SocotraPlatformChain, SocotraJUNEChain, SocotraJUNEAssetId, BigInt(0), InputError],
      [SocotraPlatformChain, SocotraJVMChain, SocotraJUNEAssetId, BigInt(0), InputError]
    ]

    testCases.forEach(([src, dest, assetId, value, expectedError]) => {
      test(`From ${(src as Blockchain).name} to ${(dest as Blockchain).name}`, async () => {
        const operation = new CrossOperation(src as Blockchain, dest as Blockchain, assetId as string, value as bigint)
        const summary = await mcnAccount.estimate(operation)
        await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError as typeof InputError | typeof AccountError)
      }, 15000)
    })
  })
})
