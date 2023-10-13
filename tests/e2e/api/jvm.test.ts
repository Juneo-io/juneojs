import {
  MCNProvider,
  type GetAssetDescriptionResponse,
  type GetBlockResponse,
  type GetHeightResponse,
  type GetTxResponse,
  SocotraNetwork,
  SocotraJUNEAsset,
  SocotraETH1Asset,
  SocotraBCH1Asset
} from '../../../src'

describe('JVMAPI', () => {
  const provider: MCNProvider = new MCNProvider(SocotraNetwork)

  describe('buildGenesis', () => {
    // TODO later
  })

  describe('getAssetDescription', () => {
    test.each([{ asset: SocotraJUNEAsset }, { asset: SocotraETH1Asset }, { asset: SocotraBCH1Asset }])(
      'Valid: $asset.assetId ($asset.symbol)',
      async ({ asset }) => {
        const result: GetAssetDescriptionResponse = await provider.jvm.getAssetDescription(asset.assetId)
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
      const result: GetAssetDescriptionResponse = await provider.jvm.getAssetDescription(assetId)
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
        const result: GetBlockResponse = await provider.jvm.getBlockByHeight(height as any)
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
      await provider.jvm.getBlockByHeight(height as any)
    })
  })

  describe('getHeight', () => {
    test('Returns height', async () => {
      const result: GetHeightResponse = await provider.jvm.getHeight()
      expect(result.height).toBeDefined()
    })
  })

  describe('getTx', () => {
    test.each([
      { txID: 'dGJVWGj3GHQRAvt87xqcVUwKNKcJRaB7iUwGpNP9PYSrk6rie' },
      { txID: '2FKNX3WoJwtbanNxVV44qaXsv8SgkiBtD4psHC2wdbLizXvGS' }
    ])('Valid: $txID', async ({ txID }) => {
      const result: GetTxResponse = await provider.jvm.getTx(txID)
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
      await provider.jvm.getTx(txID as any)
    })
  })

  describe('issueTx', () => {
    // TODO later
  })
})
