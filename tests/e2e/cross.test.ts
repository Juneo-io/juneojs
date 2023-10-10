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
    test.each([
      ['JUNE-Chain to EUROC1-Chain', SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', BigInt(1000)],
      ['EUROC1-Chain to JUNE-Chain', SocotraEUROC1Chain, SocotraJUNEChain, SocotraEUROC1AssetId, BigInt(10000000000000)],
      ['JUNE-Chain to JVM-Chain', SocotraJUNEChain, SocotraJVMChain, SocotraJUNEAssetId, BigInt(100000000000)],
      ['JUNE-Chain to EUROC1-Chain with different assetId', SocotraJUNEChain, SocotraEUROC1Chain, SocotraEUROC1AssetId, BigInt(5000)],
      ['JUNE-Chain to Platform-Chain', SocotraJUNEChain, SocotraPlatformChain, '0x4400000000000000000000000000000000000000', BigInt(6000)],
      ['JUNE-Chain to EUROC1-Chain with excessive amount', SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', EXCESSIVE_AMOUNT],
      ['JUNE-Chain to EUROC1-Chain with zero amount', SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', BigInt(0)],
      ['JUNE-Chain to EUROC1-Chain with negative amount', SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', BigInt(-1000)]
    ])('%s', async (description, src, dest, assetId, value) => {
      const operation = new CrossOperation(src, dest, assetId, value)
      expect(operation.source).toEqual(src)
      expect(operation.assetId).toEqual(assetId)
    })
  })

  describe('Valid CrossOperation', () => {
    test.each([
      ['JUNE-Chain to EUROC1-Chain', SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', BigInt(1000)],
      ['EUROC1-Chain to JUNE-Chain', SocotraEUROC1Chain, SocotraJUNEChain, SocotraEUROC1AssetId, BigInt(10000000000000)],
      ['JUNE-Chain to JVM-Chain', SocotraJUNEChain, SocotraJVMChain, SocotraJUNEAssetId, BigInt(100000000000)],
      ['JUNE-Chain to Platform-Chain', SocotraJUNEChain, SocotraPlatformChain, SocotraJUNEAssetId, BigInt(1000000000000)],
      ['Platform-Chain to JUNE-Chain', SocotraPlatformChain, SocotraJUNEChain, SocotraJUNEAssetId, BigInt(1000000)],
      ['Platform-Chain to JVM-Chain', SocotraPlatformChain, SocotraJVMChain, SocotraJUNEAssetId, BigInt(1000000)],
      ['JVM-Chain to Platform-Chain', SocotraJVMChain, SocotraPlatformChain, SocotraJUNEAssetId, BigInt(1000000)],
      ['JVM-Chain to JUNE-Chain', SocotraJVMChain, SocotraJUNEChain, SocotraJUNEAssetId, BigInt(1000000)]
    ])('%s', async (description, src, dest, assetId, value) => {
      const operation = new CrossOperation(src, dest, assetId, value)
      const summary = await mcnAccount.estimate(operation)
      const executable: ExecutableOperation = summary.getExecutable()

      await mcnAccount.execute(summary)
      expect(executable.status).toEqual('Done')
    }, 15000)
  })

  describe('Invalid Operations', () => {
    test.each([
      ['JUNE-Chain to EUROC1-Chain with negative value', SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', BigInt(-1), InputError],
      ['JUNE-Chain to EUROC1-Chain with excessive amount', SocotraJUNEChain, SocotraEUROC1Chain, '0x3300000000000000000000000000000000000000', EXCESSIVE_AMOUNT, AccountError],
      ['JUNE-Chain to EUROC1-Chain with excessive amount and different assetId', SocotraJUNEChain, SocotraEUROC1Chain, SocotraEUROC1AssetId, EXCESSIVE_AMOUNT, AccountError],
      ['JUNE-Chain to JVM-Chain with zero value', SocotraJUNEChain, SocotraJVMChain, SocotraJUNEAssetId, BigInt(0), InputError],
      ['JUNE-Chain to Platform-Chain with zero value', SocotraJUNEChain, SocotraPlatformChain, SocotraJUNEAssetId, BigInt(0), InputError],
      ['JVM-Chain to JUNE-Chain with zero value', SocotraJVMChain, SocotraJUNEChain, SocotraJUNEAssetId, BigInt(0), InputError],
      ['JVM-Chain to Platform-Chain with zero value', SocotraJVMChain, SocotraPlatformChain, SocotraJUNEAssetId, BigInt(0), InputError],
      ['Platform-Chain to JUNE-Chain with zero value', SocotraPlatformChain, SocotraJUNEChain, SocotraJUNEAssetId, BigInt(0), InputError],
      ['Platform-Chain to JVM-Chain with zero value', SocotraPlatformChain, SocotraJVMChain, SocotraJUNEAssetId, BigInt(0), InputError]
    ])('%s', async (description, src, dest, assetId, value, expectedError) => {
      const operation = new CrossOperation(src, dest, assetId, value)
      const summary = await mcnAccount.estimate(operation)
      await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError)
    }, 15000)
  })
})
