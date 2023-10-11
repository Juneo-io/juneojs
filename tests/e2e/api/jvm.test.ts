import { MCNProvider, SocotraBCH1AssetId, SocotraETC1AssetId, SocotraJUNEAssetId, type GetAssetDescriptionResponse, type GetBlockResponse, type GetHeightResponse, type GetTxResponse } from '../../../src'

describe('JVMAPI tests', () => {
  const provider: MCNProvider = new MCNProvider()

  describe('buildGenesis', () => {
    // TODO later
  })

  describe('getAssetDescription', () => {
    test.each([
      [SocotraJUNEAssetId, 'JUNE'],
      [SocotraETC1AssetId, 'Ethereum Classic'],
      [SocotraBCH1AssetId, 'Bitcoin Cash']
    ])('Asset description for %s', async (assetId, expectedName) => {
      const result: GetAssetDescriptionResponse = await provider.jvm.getAssetDescription(assetId)
      expect(result.name).toEqual(expectedName)
    })

    test.failing.each([
      ['SocotraJUNEAssetId', 'JUNE'],
      ['2RcLCZTsxSnvzeBvtrjRo8PCzLXuecHBoyr8DNp1R8ob8kHkbZ', 'Ethereum Classic'],
      ['fakeAssetId', 'Bitcoin Cash']
    ])('Asset description for %s', async (assetId, expectedName) => {
      const result: GetAssetDescriptionResponse = await provider.jvm.getAssetDescription(assetId)
      expect(result.name).toEqual(expectedName)
    })
  })

  describe('getBlock', () => {
    // TODO later, need to have index api enabled
  })

  describe('getBlockByHeight', () => {
    test.each([
      ['should be defined for height 1', 1],
      ['should be defined for height 10', 10],
      ['should be defined for height 100', 100],
      ['should handle null input', null],
      ['should handle undefined input', undefined]
    ])('%s', async (description, height) => {
      const result: GetBlockResponse = await provider.jvm.getBlockByHeight(height as any)
      expect(result).toBeDefined()
    })

    test.failing.each([
      ['should handle negative height', -1],
      ['should handle string input', 'aString'],
      ['should handle object input', {}],
      ['should handle array input', []]
    ])('%s', async (description, height) => {
      await provider.jvm.getBlockByHeight(height as any)
    })
  })

  describe('getHeight', () => {
    test('Should return height', async () => {
      const result: GetHeightResponse = await provider.jvm.getHeight()
      expect(result).toBeDefined()
    })
  })

  describe('getTx', () => {
    test.each([
      ['should be defined for valid txID', 'dGJVWGj3GHQRAvt87xqcVUwKNKcJRaB7iUwGpNP9PYSrk6rie'],
      ['should be defined for valid txID', '2FKNX3WoJwtbanNxVV44qaXsv8SgkiBtD4psHC2wdbLizXvGS']
    ])('%s', async (description, txID) => {
      const result: GetTxResponse = await provider.jvm.getTx(txID)
      expect(result).toBeDefined()
    })

    test.failing.each([
      ['should handle invalid txID', 'invalidTxID'],
      ['should handle numerical string', '123'],
      ['should handle null input', null],
      ['should handle undefined input', undefined],
      ['should handle object input', {}],
      ['should handle array input', []]
    ])('%s', async (description, txID) => {
      await provider.jvm.getTx(txID as any)
    })
  })

  describe('issueTx', () => {
    // TODO later
  })
})
