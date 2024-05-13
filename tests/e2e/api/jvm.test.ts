import {
  MCNProvider,
  type GetAssetDescriptionResponse,
  type GetBlockResponse,
  type GetHeightResponse,
  type GetTxResponse,
  GenesisNetwork,
  GenesisJUNEAsset,
  GenesisETH1Asset,
  GenesisBCH1Asset,
  JuneoClient
} from '../../../src'

describe('JVMAPI', () => {
  const provider: MCNProvider = new MCNProvider(GenesisNetwork, JuneoClient.parse('http://172.232.42.69:9650'))

  describe('buildGenesis', () => {
    // TODO later
  })

  describe('getAssetDescription', () => {
    test.each([{ asset: GenesisJUNEAsset }, { asset: GenesisETH1Asset }, { asset: GenesisBCH1Asset }])(
      'Valid: $asset.assetId ($asset.symbol)',
      async ({ asset }) => {
        const result: GetAssetDescriptionResponse = await provider.jvmApi.getAssetDescription(asset.assetId)
        // TODO in Socotra2 use asset name
        expect(result.name).toBeDefined()
        expect(result.symbol).toEqual(asset.symbol)
        expect(result.denomination).toEqual(asset.decimals.toString())
        expect(result.assetID).toEqual(asset.assetId)
      }
    )

    test.failing.each([
      { assetId: '2RcLCZTsxSnvzeBvtrjRo8PCzLXuecHBoyr8DNp1R8ob8kHkbZ' },
      { assetId: 'INVALID_ASSET_ID' }
    ])('Invalid: $assetId', async ({ assetId }) => {
      const result: GetAssetDescriptionResponse = await provider.jvmApi.getAssetDescription(assetId)
      expect(result.name).toBeDefined()
    })
  })

  describe('getBlock', () => {
    // TODO later, need to have index api enabled
  })

  describe('getBlockByHeight', () => {
    test.each([{ height: 1 }, { height: 10 }, { height: 100 }, { height: null }, { height: undefined }])(
      'Valid: $height',
      async ({ height }) => {
        const result: GetBlockResponse = await provider.jvmApi.getBlockByHeight(height as any)
        expect(result.block).toBeDefined()
        expect(result.encoding).toBeDefined()
      }
    )

    test.failing.each([
      { description: 'Negative height', height: -1 },
      { description: 'String input', height: 'aString' },
      { description: 'Object input', height: {} },
      { description: 'Array input', height: [] }
    ])('$description: $height', async ({ height }) => {
      await provider.jvmApi.getBlockByHeight(height as any)
    })
  })

  describe('getHeight', () => {
    test('Returns height', async () => {
      const result: GetHeightResponse = await provider.jvmApi.getHeight()
      expect(result.height).toBeDefined()
    })
  })

  describe('getTx', () => {
    test.each([
      { txID: 'dGJVWGj3GHQRAvt87xqcVUwKNKcJRaB7iUwGpNP9PYSrk6rie' },
      { txID: '2FKNX3WoJwtbanNxVV44qaXsv8SgkiBtD4psHC2wdbLizXvGS' }
    ])('Valid: $txID', async ({ txID }) => {
      const result: GetTxResponse = await provider.jvmApi.getTx(txID)
      expect(result.encoding).toBeDefined()
      expect(result.tx).toBeDefined()
    })

    test.failing.each([
      { description: 'Invalid txID', txID: 'INVALID_TX_ID' },
      { description: 'Numerical string', txID: '123' },
      { description: 'Null input', txID: null },
      { description: 'Undefined input', txID: undefined },
      { description: 'Object input', txID: {} },
      { description: 'Array input', txID: [] }
    ])('$description: $txID', async ({ txID }) => {
      await provider.jvmApi.getTx(txID as any)
    })
  })

  describe('issueTx', () => {
    // TODO later
  })
})
