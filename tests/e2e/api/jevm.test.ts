import { MCNProvider, SocotraEUROC1AssetId, SocotraJUNEChain } from '../../../src'

describe('JEVMAPI tests', () => {
  const provider: MCNProvider = new MCNProvider()

  describe('getTx', () => {
    test.each([
      ['241mEKvJetzAbVxvSsooEaAYgXkaipSDuxEoXBxBDP8mKHb8Cm']
    ])('Correct transaction for txID', async (txID) => {
      const result = await provider.jevm[SocotraJUNEChain.id].getTx(txID)
      expect(result.tx).toBeDefined()
    })

    test.failing.each([
      ['241mEKvJjtzAbVxvSsooEaAYgXkaipSDuxEoXBxBDP8mKHb8Cm'],
      ['0x3c529e9941b6ca0ec34948c7f797e94ff810643ef64896c409ea0df36be9e554'],
      ['wrongTxID']
    ])('not gettransaction for txID', async (txID) => {
      const result = await provider.jevm[SocotraJUNEChain.id].getTx(txID)
      expect(result.tx).toBeDefined()
    })
  })

  describe('getTxStatus', () => {
    test.each([
      ['241mEKvJetzAbVxvSsooEaAYgXkaipSDuxEoXBxBDP8mKHb8Cm']
    ])('Status Accepted for txID', async (txID) => {
      const result = await provider.jevm[SocotraJUNEChain.id].getTxStatus(txID)
      expect(result.status).toEqual('Accepted')
      expect(result.blockHeight).toEqual('4976404')
    })
  })

  describe('issueTx', () => {
    // TODO : find a way to test issueTx
  })

  describe('eth_getAssetBalance', () => {
    test.each([
      ['0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529', '0x4BF7C5', SocotraEUROC1AssetId, BigInt(204427130n)]
    ])('should return correct asset balance', async (address, block, assetID, expectedBalance) => {
      const result = await provider.jevm[SocotraJUNEChain.id].eth_getAssetBalance(address, block, assetID)
      expect(result).toEqual(expectedBalance)
    })

    describe('eth_getAssetBalance failing tests', () => {
      test.failing.each([
        ['wrong address', '0x9b31d8C5Dd49fCdE96218895f96a6eC894529', '0x4BF7C5', SocotraEUROC1AssetId, null],
        ['wrong block', '0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529', '2000', SocotraEUROC1AssetId, null],
        ['wrong assetID', '0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529', '0x4BF7C5', '0x0', null]
      ])('%s', async (description, address, block, assetID) => {
        await provider.jevm[SocotraJUNEChain.id].eth_getAssetBalance(address, block, assetID)
      })
    })
  })

  describe('eth_baseFee', () => {
    test('should return correct base fee', async () => {
      const result = await provider.jevm[SocotraJUNEChain.id].eth_baseFee()
      expect(result).toBeDefined()
    })
  })

  describe('eth_maxPriorityFeePerGas', () => {
    test('should return correct max priority fee per gas', async () => {
      const result = await provider.jevm[SocotraJUNEChain.id].eth_maxPriorityFeePerGas()
      expect(result).toBeDefined()
    })
  })

  describe('eth_getChainConfig', () => {
    test('should return correct chain config', async () => {
      const result = await provider.jevm[SocotraJUNEChain.id].eth_getChainConfig()
      expect(result).toBeDefined()
    })
  })

  describe('eth_getBalance', () => {
    test.each([
      ['0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529', '0x4BF7C5', BigInt(38623609074512286678n)]
    ])('should return correct balance', async (address, block, expectedBalance) => {
      const result = await provider.jevm[SocotraJUNEChain.id].eth_getBalance(address, block)
      expect(result).toEqual(expectedBalance)
    })
  })

  describe('eth_getTransactionCount', () => {
    test.each([
      ['0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529', '0x4BF7C5', BigInt(511)]
    ])('should return correct transaction count', async (address, block, expectedCount) => {
      const result = await provider.jevm[SocotraJUNEChain.id].eth_getTransactionCount(address, block)
      expect(result).toEqual(expectedCount)
    })
  })
})
