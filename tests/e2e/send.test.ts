import * as dotenv from 'dotenv'
import {
  AccountError,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SendOperation,
  SocotraEUROC1AssetId,
  SocotraEUROC1Chain,
  SocotraJUNEAssetId,
  SocotraJUNEChain,
  SocotraJVMChain,
  type ExecutableOperation
} from '../../src'

dotenv.config()

describe('Send Operations', () => {
  const wallet = MCNWallet.recover(process.env.MNEMONIC ?? '')
  const provider: MCNProvider = new MCNProvider()
  const mcnAccount: MCNAccount = new MCNAccount(provider, wallet)
  const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')

  beforeAll(async () => {
    await mcnAccount.fetchChainsBalances()
  })

  describe('EVM Send Operations', () => {
    describe('Valid Operations', () => {
      test.each([
        ['JUNE-Chain with JUNEAssetId', SocotraJUNEChain, SocotraJUNEAssetId, BigInt(1000), '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26'],
        ['JUNE-Chain with ETH1AssetId', SocotraJUNEChain, '0x2d00000000000000000000000000000000000000', BigInt(1), '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26'],
        ['ETH1-Chain with ETH1AssetId', SocotraEUROC1Chain, SocotraEUROC1AssetId, BigInt(10000000000000), '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26']
      ])('%s', async (description, chain, assetId, value, recipient) => {
        const operation = new SendOperation(chain, assetId, value, recipient)
        const summary = await mcnAccount.estimate(operation)
        const executable: ExecutableOperation = summary.getExecutable()

        await mcnAccount.execute(summary)
        expect(executable.status).toEqual('Done')
      })
    })

    describe('Invalid Operations', () => {
      test.each([
        ['JUNE-Chain with negative value', SocotraJUNEChain, SocotraJUNEAssetId, BigInt(-1), '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26', RangeError],
        ['JUNE-Chain with excessive amount', SocotraJUNEChain, SocotraJUNEAssetId, EXCESSIVE_AMOUNT, '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26', AccountError],
        ['JUNE-Chain with excessive amount and different assetId', SocotraJUNEChain, SocotraEUROC1AssetId, EXCESSIVE_AMOUNT, '0x3c647d88Bc92766075feA7A965CA599CAAB2FD26', AccountError]
      ])('%s', async (description, chain, assetId, value, recipient, expectedError) => {
        const operation = new SendOperation(chain, assetId, value, recipient)
        const summary = await mcnAccount.estimate(operation)
        await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError)
      })
    })
  })

  describe('JVM Send Operations', () => {
    describe('Valid Operations', () => {
      test.each([
        ['JVM-Chain with JUNEAssetId', SocotraJVMChain, SocotraJUNEAssetId, BigInt(10000000), 'JVM-socotra167w40pwvlrf5eg0d9t48zj6kwkaqz2xan50pal']
      ])('%s', async (description, chain, assetId, value, recipient) => {
        const operation = new SendOperation(chain, assetId, value, recipient)
        const summary = await mcnAccount.estimate(operation)
        const executable: ExecutableOperation = summary.getExecutable()

        await mcnAccount.execute(summary)
        expect(executable.status).toEqual('Done')
      })
    })

    describe('Invalid Operations', () => {
      test.each([
        ['JVM-Chain with excessive amount', SocotraJVMChain, SocotraJUNEAssetId, EXCESSIVE_AMOUNT, 'JVM-socotra167w40pwvlrf5eg0d9t48zj6kwkaqz2xan50pal', AccountError],
        ['JVM-Chain with zero value', SocotraJVMChain, SocotraJUNEAssetId, BigInt(0), 'JVM-socotra167w40pwvlrf5eg0d9t48zj6kwkaqz2xan50pal', TypeError]
      ])('%s', async (description, chain, assetId, value, recipient, expectedError) => {
        const operation = new SendOperation(chain, assetId, value, recipient)
        const summary = await mcnAccount.estimate(operation)
        await expect(mcnAccount.execute(summary)).rejects.toThrow(expectedError)
      })
    })
  })
})
