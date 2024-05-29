import { GenesisEUROC1Asset, GenesisJUNEChain } from '../../../src'
import { PROVIDER } from '../constants'

describe('JEVMAPI', () => {
  describe('getTx', () => {
    test.failing.each([
      { txID: '241mEKvJjtzAbVxvSsooEaAYgXkaipSDuxEoXBxBDP8mKHb8Cm' },
      { txID: '0x3c529e9941b6ca0ec34948c7f797e94ff810643ef64896c409ea0df36be9e554' },
      { txID: 'INVALID_TX_ID' },
    ])('Invalid: $txID', async ({ txID }) => {
      const result = await PROVIDER.jevmApi[GenesisJUNEChain.id].getTx(txID)
      expect(result.tx).toBeDefined()
    })
  })

  describe('eth_getAssetBalance', () => {
    test.failing.each([
      {
        description: 'Wrong address',
        address: '0x9b31d8C5Dd49fCdE96218895f96a6eC894529',
        block: '0x4BF7C5',
        assetID: GenesisEUROC1Asset.assetId,
      },
      {
        description: 'Wrong block',
        address: '0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529',
        block: '2000',
        assetID: GenesisEUROC1Asset.assetId,
      },
      {
        description: 'Wrong assetID',
        address: '0x9b31d8C5Dd49fCdE96218895f96a6eC1ea894529',
        block: '0x4BF7C5',
        assetID: '0x0',
      },
    ])('$description: $address, $block, $assetID', async ({ address, block, assetID }) => {
      await PROVIDER.jevmApi[GenesisJUNEChain.id].eth_getAssetBalance(address, block, assetID)
    })
  })

  describe('eth_baseFee', () => {
    test('Returns base fee', async () => {
      const result = await PROVIDER.jevmApi[GenesisJUNEChain.id].eth_baseFee()
      expect(result).toBeDefined()
    })
  })

  describe('eth_maxPriorityFeePerGas', () => {
    test('Returns max priority fee per gas', async () => {
      const result = await PROVIDER.jevmApi[GenesisJUNEChain.id].eth_maxPriorityFeePerGas()
      expect(result).toBeDefined()
    })
  })

  describe('eth_getChainConfig', () => {
    test('Returns chain config', async () => {
      const result = await PROVIDER.jevmApi[GenesisJUNEChain.id].eth_getChainConfig()
      expect(result).toBeDefined()
    })
  })
})
