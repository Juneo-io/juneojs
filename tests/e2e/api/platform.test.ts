import { SocotraBCH1Chain, SocotraJUNEChain, type GetBlockResponse } from '../../../src'
import { PROVIDER } from '../constants'

describe('PlatformAPI', () => {
  describe('getBlock', () => {
    test.each([
      { blockID: '25ttEN33bZ4nj2TYUWYrMrmx3jShwGQwsakjckPvk75FXnPKx' },
      { blockID: '8uUGsfz6PfnLqF5H3FA6PkkcVv5bZ7o35SgBX1VcrLgEGEdn7' }
    ])('Valid blockID: $blockID', async ({ blockID }) => {
      const result: GetBlockResponse = await PROVIDER.platformApi.getBlock(blockID)
      expect(result.block).toBeDefined()
      expect(result.encoding).toBeDefined()
    })

    test.failing.each([
      { description: 'Invalid blockID', blockID: 'INVALID_BLOCK_ID' },
      { description: 'Null input', blockID: null },
      { description: 'Undefined input', blockID: undefined }
    ])('$description: $blockID', async ({ blockID }) => {
      await PROVIDER.platformApi.getBlock(blockID as any)
    })
  })

  describe('getBlockByHeight', () => {
    // TODO later, need to have index api enabled
  })

  describe('getBlockchains', () => {
    // Deprecated
  })

  describe('getBlockchainStatus', () => {
    test.each([
      { blockchainID: SocotraJUNEChain.id },
      { blockchainID: SocotraBCH1Chain.id },
      { blockchainID: '2k1EyxAV5XYPxnsuPVrKyquUTLC3EMA1c5AhM7r8sRy1Kg7Zje' }
    ])('Valid blockchainID: $blockchainID', async ({ blockchainID }) => {
      const result = await PROVIDER.platformApi.getBlockchainStatus(blockchainID)
      expect(result.status).toBeDefined()
    })

    test.failing.each([
      { description: 'Invalid blockchainID', blockchainID: 'INVALID_BLOCKCHAIN_ID' },
      { description: 'Null input', blockchainID: null },
      { description: 'Undefined input', blockchainID: undefined }
    ])('$description: $blockchainID', async ({ blockchainID }) => {
      await PROVIDER.platformApi.getBlockchainStatus(blockchainID as any)
    })
  })

  describe('getCurrentSupply', () => {
    test('Returns current supply', async () => {
      const result = await PROVIDER.platformApi.getCurrentSupply()
      expect(result.supply).toBeDefined()
    })
  })

  describe('getCurrentValidators', () => {
    test.each([
      { description: 'Without arguments', supernetID: undefined, nodeIDs: undefined },
      { description: 'With supernetID', supernetID: PROVIDER.mcn.primary.id, nodeIDs: undefined },
      {
        description: 'With nodeIDs',
        supernetID: undefined,
        nodeIDs: ['NodeID-B2GHMQ8GF6FyrvmPUX6miaGeuVLH9UwHr']
      },
      {
        description: 'With supernetID and nodeIDs',
        supernetID: PROVIDER.mcn.primary.id,
        nodeIDs: ['NodeID-B2GHMQ8GF6FyrvmPUX6miaGeuVLH9UwHr']
      }
    ])('$description: $supernetID, $nodeIDs', async ({ supernetID, nodeIDs }) => {
      const result = await PROVIDER.platformApi.getCurrentValidators(supernetID, nodeIDs)
      expect(result.validators).toBeDefined()
    })

    test.failing.each([
      { description: 'Invalid supernetID', supernetID: 'INVALID_SUPERNET_ID', nodeIDs: undefined },
      { description: 'Invalid nodeIDs', supernetID: undefined, nodeIDs: ['INVALID_NODE_ID'] },
      {
        description: 'Invalid supernetID and nodeIDs',
        supernetID: 'INVALID_SUPERNET_ID',
        nodeIDs: ['INVALID_NODE_ID']
      }
    ])('$description: $supernetID, $nodeIDs', async ({ supernetID, nodeIDs }) => {
      await PROVIDER.platformApi.getCurrentValidators(supernetID as any, nodeIDs as any)
    })
  })

  describe('getHeight', () => {
    test('Returns blockchain height', async () => {
      const result = await PROVIDER.platformApi.getHeight()
      expect(result.height).toBeDefined()
    })
  })

  describe('getMinStake', () => {
    test.each([
      { description: 'Without supernetID', supernetID: undefined },
      { description: 'With supernetID', supernetID: PROVIDER.mcn.primary.id }
    ])('$description: $supernetID', async ({ supernetID }) => {
      const result = await PROVIDER.platformApi.getMinStake(supernetID)
      expect(result.minDelegatorStake).toBeDefined()
      expect(result.minValidatorStake).toBeDefined()
    })

    test.failing.each([
      { description: 'Invalid supernetID', supernetID: 'INVALID_SUPERNET_ID' },
      {
        description: 'Permissionned supernet supernetID',
        supernetID: 'qyieai1WRqtxqKwn8CUUAfgXfu6rQbHJhiiLE6DpCWHXtHTGG'
      }
    ])('$description: $supernetID', async ({ supernetID }) => {
      await PROVIDER.platformApi.getMinStake(supernetID as any)
    })
  })

  describe('getStakingAssetID', () => {
    test.each([
      { description: 'Without supernetID', supernetID: undefined },
      { description: 'With supernetID', supernetID: PROVIDER.mcn.primary.id }
    ])('$description: $supernetID', async ({ supernetID }) => {
      const result = await PROVIDER.platformApi.getStakingAssetID(supernetID)
      expect(result.assetID).toBeDefined()
    })

    test.failing.each([{ description: 'Invalid supernetID', supernetID: 'INVALID_SUPERNET_ID' }])(
      '$description: $supernetID',
      async ({ supernetID }) => {
        await PROVIDER.platformApi.getStakingAssetID(supernetID as any)
      }
    )
  })

  describe('getSupernets', () => {
    //  Deprecated
  })

  describe('getTimestamp', () => {
    test('Returns platform timestamp', async () => {
      const result = await PROVIDER.platformApi.getTimestamp()
      expect(result.timestamp).toBeDefined()
    })
  })

  describe('getTotalStake', () => {
    test.each([{ supernetID: PROVIDER.mcn.primary.id }])(
      'Returns total stake of $supernetID',
      async ({ supernetID }) => {
        const result = await PROVIDER.platformApi.getTotalStake(supernetID)
        expect(result.stake).toBeDefined()
        expect(result.weight).toBeDefined()
      }
    )

    test.failing.each([
      { description: 'Invalid supernetID', supernetID: 'INVALID_SUPERNET_ID' },
      {
        description: 'Permissionned supernet supernetID',
        supernetID: 'ZLfejkjx2AwkaNbGC7oQxX3gE6G1YLs4FzMimQEG6Us2bUpW'
      }
    ])('$description: $supernetID', async ({ supernetID }) => {
      await PROVIDER.platformApi.getTotalStake(supernetID as any)
    })
  })

  describe('getTx', () => {
    test.each([
      { txID: '2G5dJ1kQFu7S6pJTffKqcnfVGNcFGCmtZE3D3fCPDSQuCRrM5p' },
      { txID: 'V39EFBBf2yXLqacsmFrM1WRhvtHfMa55LY2CwFsVLDK64sKXG' }
    ])('Valid txID: $txID', async ({ txID }) => {
      const result = await PROVIDER.platformApi.getTx(txID)
      expect(result.encoding).toBeDefined()
      expect(result.tx).toBeDefined()
    })

    test.failing.each([
      { description: 'Invalid txID', txID: '27xs3BGknXSSKazd6rczsFCHTvDLQ4dcH9BrgSwKepQcYB5VGc3' },
      { description: 'Null txID', txID: null },
      { description: 'Undefined txID', txID: undefined }
    ])('$description: $txID', async ({ txID }) => {
      await PROVIDER.platformApi.getTx(txID as any)
    })
  })

  describe('getTxStatus', () => {
    test.each([
      { txID: '27xs3BGknXSSKg86rczsFCHTvDLQ4dcH9BrgSwKepQcYB5VGc3' },
      { txID: '2qbN8EiGKprtFLkQxnQMgqbXSWdui5rwVUTsQp5Z5RYFphy1oK' }
    ])('Valid txID: $txID', async ({ txID }) => {
      const result = await PROVIDER.platformApi.getTxStatus(txID)
      expect(result.status).toBeDefined()
    })

    test.failing.each([{ description: 'Invalid txID', txID: '27xs3BGknXSSKazd6rczsFCHTvDLQ4dcH9BrgSwKepQcYB5VGc3' }])(
      '$description: $txID',
      async ({ txID }) => {
        await PROVIDER.platformApi.getTxStatus(txID as any)
      }
    )
  })

  describe('getValidatorsAt', () => {
    test.each([{ height: 100 }, { height: 200 }])('Valid height: $height', async ({ height }) => {
      const result = await PROVIDER.platformApi.getValidatorsAt(height)
      // TODO: Check the result
      expect(result).toBeDefined()
    })
  })

  describe('issueTx', () => {
    // TODO later
  })

  describe('sampleValidators', () => {
    test.each([{ size: 10 }, { size: 20 }])('Valid size: $size', async ({ size }) => {
      const result = await PROVIDER.platformApi.sampleValidators(size)
      expect(result.validators).toBeDefined()
    })
  })

  describe('validatedBy', () => {
    test.each([
      { blockchainID: SocotraJUNEChain.id },
      { blockchainID: '3pW4zxtzuMAWLA6rdttWDqkVMtGRTqohthSDW962k8GTNyKXj' }
    ])('Valid blockchainID: $blockchainID', async ({ blockchainID }) => {
      const result = await PROVIDER.platformApi.validatedBy(blockchainID)
      expect(result.supernetID).toBeDefined()
    })
  })

  describe('validates', () => {
    test.each([
      { supernetID: PROVIDER.mcn.primary.id },
      { supernetID: 'qyieai1WRqtxqKwn8CUUAfgXfu6rQbHJhiiLE6DpCWHXtHTGG' }
    ])('Valid supernetID: $supernetID', async ({ supernetID }) => {
      const result = await PROVIDER.platformApi.validates(supernetID)
      expect(result.blockchainIDs).toBeDefined()
    })
    test.failing.each([{ description: 'Invalid supernetID', supernetID: 'INVALID_SUPERNET_ID' }])(
      '$description: $supernetID',
      async ({ supernetID }) => {
        await PROVIDER.platformApi.validates(supernetID as any)
      }
    )
  })
})
