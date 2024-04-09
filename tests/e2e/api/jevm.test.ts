import { MCNProvider, GenesisEUROC1Asset, GenesisJUNEChain, GenesisNetwork } from '../../../src'

describe('JEVMAPI', () => {
  const provider: MCNProvider = new MCNProvider(GenesisNetwork)

  describe('getTx', () => {
    test.each([{ txID: '241mEKvJetzAbVxvSsooEaAYgXkaipSDuxEoXBxBDP8mKHb8Cm' }])('Valid: $txID', async ({ txID }) => {
      const result = await provider.jevm[GenesisJUNEChain.id].getTx(txID)
      expect(result.blockHeight).toBeDefined()
      expect(result.encoding).toBeDefined()
      expect(result.tx).toBeDefined()
    })

    test.failing.each([
      { txID: '241mEKvJjtzAbVxvSsooEaAYgXkaipSDuxEoXBxBDP8mKHb8Cm' },
      { txID: '0x3c529e9941b6ca0ec34948c7f797e94ff810643ef64896c409ea0df36be9e554' },
      { txID: 'INVALID_TX_ID' }
    ])('Invalid: $txID', async ({ txID }) => {
      const result = await provider.jevm[GenesisJUNEChain.id].getTx(txID)
      expect(result.tx).toBeDefined()
    })
  })

  describe('getTxStatus', () => {
    test.each([{ txID: '241mEKvJetzAbVxvSsooEaAYgXkaipSDuxEoXBxBDP8mKHb8Cm' }])('Valid: $txID', async ({ txID }) => {
      const result = await provider.jevm[GenesisJUNEChain.id].getTxStatus(txID)
      expect(result.status).toEqual('Accepted')
      expect(result.blockHeight).toEqual('4976404')
    })
  })

  describe('issueTx', () => {
    // TODO : find a way to test issueTx
  })

  describe('eth_getAssetBalance', () => {
    test.each([
      {
        address: '0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529',
        block: '0x4BF7C5',
        asset: GenesisEUROC1Asset,
        expectedBalance: BigInt('204427130')
      }
    ])('$asset.symbol balance of $address at block $block', async ({ address, block, asset, expectedBalance }) => {
      const result = await provider.jevm[GenesisJUNEChain.id].eth_getAssetBalance(address, block, asset.assetId)
      expect(result).toEqual(expectedBalance)
    })

    test.failing.each([
      {
        description: 'Wrong address',
        address: '0x9b31d8C5Dd49fCdE96218895f96a6eC894529',
        block: '0x4BF7C5',
        assetID: GenesisEUROC1Asset.assetId
      },
      {
        description: 'Wrong block',
        address: '0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529',
        block: '2000',
        assetID: GenesisEUROC1Asset.assetId
      },
      {
        description: 'Wrong assetID',
        address: '0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529',
        block: '0x4BF7C5',
        assetID: '0x0'
      }
    ])('$description: $address, $block, $assetID', async ({ address, block, assetID }) => {
      await provider.jevm[GenesisJUNEChain.id].eth_getAssetBalance(address, block, assetID)
    })
  })

  describe('eth_baseFee', () => {
    test('Returns base fee', async () => {
      const result = await provider.jevm[GenesisJUNEChain.id].eth_baseFee()
      expect(result).toBeDefined()
    })
  })

  describe('eth_maxPriorityFeePerGas', () => {
    test('Returns max priority fee per gas', async () => {
      const result = await provider.jevm[GenesisJUNEChain.id].eth_maxPriorityFeePerGas()
      expect(result).toBeDefined()
    })
  })

  describe('eth_getChainConfig', () => {
    test('Returns chain config', async () => {
      const result = await provider.jevm[GenesisJUNEChain.id].eth_getChainConfig()
      expect(result).toBeDefined()
    })
  })

  describe('eth_getBalance', () => {
    test.each([
      {
        address: '0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529',
        block: '0x4BF7C5',
        expectedBalance: BigInt('38623609074512286678')
      }
    ])('Valid from $address at block $block', async ({ address, block, expectedBalance }) => {
      const result = await provider.jevm[GenesisJUNEChain.id].eth_getBalance(address, block)
      expect(result).toEqual(expectedBalance)
    })
  })

  describe('eth_getTransactionCount', () => {
    test.each([
      { address: '0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529', block: '0x4BF7C5', expectedCount: BigInt(511) }
    ])('Valid from $address at block $block', async ({ address, block, expectedCount }) => {
      const result = await provider.jevm[GenesisJUNEChain.id].eth_getTransactionCount(address, block)
      expect(result).toEqual(expectedCount)
    })
  })
})
