import { MCNProvider, SocotraBCH1Chain, SocotraJUNEChain, type GetBlockResponse, SocotraNetwork } from '../../../src'

describe('PlatformAPI', () => {
  const provider: MCNProvider = new MCNProvider(SocotraNetwork)

  describe('getBlock', () => {
    test.each([
      { blockID: '2qbN8EiGKprtFLkQxnQMgqbXSWdui5rwVUTsQp5Z5RYFphy1oK' },
      { blockID: '2K8nAXkMwgnJRCFMAS7KiJSkBbDYKtFP6JH7ww2YiAjg6XnN69' }
    ])('Valid blockID: $blockID', async ({ blockID }) => {
      const result: GetBlockResponse = await provider.platform.getBlock(blockID)
      expect(result.block).toBeDefined()
      expect(result.encoding).toBeDefined()
    })

    test.failing.each([
      { description: 'Invalid blockID', blockID: 'INVALID_BLOCK_ID' },
      { description: 'Null input', blockID: null },
      { description: 'Undefined input', blockID: undefined }
    ])('$description: $blockID', async ({ blockID }) => {
      await provider.platform.getBlock(blockID as any)
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
      const result = await provider.platform.getBlockchainStatus(blockchainID)
      expect(result.status).toBeDefined()
    })

    test.failing.each([
      { description: 'Invalid blockchainID', blockchainID: 'INVALID_BLOCKCHAIN_ID' },
      { description: 'Null input', blockchainID: null },
      { description: 'Undefined input', blockchainID: undefined }
    ])('$description: $blockchainID', async ({ blockchainID }) => {
      await provider.platform.getBlockchainStatus(blockchainID as any)
    })
  })

  describe('getCurrentSupply', () => {
    test('Returns current supply', async () => {
      const result = await provider.platform.getCurrentSupply()
      expect(result.supply).toBeDefined()
    })
  })

  describe('getCurrentValidators', () => {
    test.each([
      { description: 'Without arguments', supernetID: undefined, nodeIDs: undefined },
      { description: 'With supernetID', supernetID: provider.mcn.primary.id, nodeIDs: undefined },
      {
        description: 'With nodeIDs',
        supernetID: undefined,
        nodeIDs: ['NodeID-B2GHMQ8GF6FyrvmPUX6miaGeuVLH9UwHr']
      },
      {
        description: 'With supernetID and nodeIDs',
        supernetID: provider.mcn.primary.id,
        nodeIDs: ['NodeID-B2GHMQ8GF6FyrvmPUX6miaGeuVLH9UwHr']
      }
    ])('$description: $supernetID, $nodeIDs', async ({ supernetID, nodeIDs }) => {
      const result = await provider.platform.getCurrentValidators(supernetID, nodeIDs)
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
      await provider.platform.getCurrentValidators(supernetID as any, nodeIDs as any)
    })
  })

  describe('getHeight', () => {
    test('Returns blockchain height', async () => {
      const result = await provider.platform.getHeight()
      expect(result.height).toBeDefined()
    })
  })

  describe('getMinStake', () => {
    test.each([
      { description: 'Without supernetID', supernetID: undefined },
      { description: 'With supernetID', supernetID: provider.mcn.primary.id }
    ])('$description: $supernetID', async ({ supernetID }) => {
      const result = await provider.platform.getMinStake(supernetID)
      expect(result.minDelegatorStake).toBeDefined()
      expect(result.minValidatorStake).toBeDefined()
    })

    test.failing.each([
      { description: 'Invalid supernetID', supernetID: 'INVALID_SUPERNET_ID' },
      {
        description: 'Permissionned supernet supernetID',
        supernetID: 'ZLfejkjx2AwkaNbGC7oQxX3gE6G1YLs4FzMimQEG6Us2b7UpW'
      }
    ])('$description: $supernetID', async ({ supernetID }) => {
      await provider.platform.getMinStake(supernetID as any)
    })
  })

  describe('getPendingValidators', () => {
    test.each([
      { description: 'Without supernetID and nodeIDs', supernetID: undefined, nodeIDs: undefined },
      { description: 'With supernetID', supernetID: provider.mcn.primary.id, nodeIDs: undefined },
      { description: 'With nodeIDs', supernetID: undefined, nodeIDs: ['NodeID-B2GHMQ8GF6FyrvmPUX6miaGeuVLH9UwHr'] },
      {
        description: 'With supernetID and nodeIDs',
        supernetID: provider.mcn.primary.id,
        nodeIDs: ['NodeID-B2GHMQ8GF6FyrvmPUX6miaGeuVLH9UwHr']
      }
    ])('$description: $supernetID, $nodeIDs', async ({ supernetID, nodeIDs }) => {
      const result = await provider.platform.getPendingValidators(supernetID, nodeIDs)
      expect(result.delegators).toBeDefined()
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
      await provider.platform.getPendingValidators(supernetID as any, nodeIDs as any)
    })
  })

  describe('getStakingAssetID', () => {
    test.each([
      { description: 'Without supernetID', supernetID: undefined },
      { description: 'With supernetID', supernetID: provider.mcn.primary.id }
    ])('$description: $supernetID', async ({ supernetID }) => {
      const result = await provider.platform.getStakingAssetID(supernetID)
      expect(result.assetID).toBeDefined()
    })

    test.failing.each([{ description: 'Invalid supernetID', supernetID: 'INVALID_SUPERNET_ID' }])(
      '$description: $supernetID',
      async ({ supernetID }) => {
        await provider.platform.getStakingAssetID(supernetID as any)
      }
    )
  })

  describe('getSupernets', () => {
    //  Deprecated
  })

  describe('getTimestamp', () => {
    test('Returns platform timestamp', async () => {
      const result = await provider.platform.getTimestamp()

      //  TODO change to timestamp
      // expect(result.timestamp).toBeDefined()

      expect(result).toBeDefined()
    })
  })

  describe('getTotalStake', () => {
    test.each([{ supernetID: provider.mcn.primary.id }])(
      'Returns total stake of $supernetID',
      async ({ supernetID }) => {
        const result = await provider.platform.getTotalStake(supernetID)
        expect(result.stake).toBeDefined()
        expect(result.weight).toBeDefined()
      }
    )

    test.failing.each([
      { description: 'Invalid supernetID', supernetID: 'INVALID_SUPERNET_ID' },
      {
        description: 'Permissionned supernet supernetID',
        supernetID: 'ZLfejkjx2AwkaNbGC7oQxX3gE6G1YLs4FzMimQEG6Us2b7UpW'
      }
    ])('$description: $supernetID', async ({ supernetID }) => {
      await provider.platform.getTotalStake(supernetID as any)
    })
  })

  describe('getTx', () => {
    test.each([
      { txID: '2tCUnxobnWD6PgRMVaBJt6uiUxk9NcjLU6Emczbj64GF7dnkcp' },
      { txID: '27xs3BGknXSSKg86rczsFCHTvDLQ4dcH9BrgSwKepQcYB5VGc3' }
    ])('Valid txID: $txID', async ({ txID }) => {
      const result = await provider.platform.getTx(txID)
      expect(result.encoding).toBeDefined()
      expect(result.tx).toBeDefined()
    })

    test.failing.each([
      { description: 'Invalid txID', txID: '27xs3BGknXSSKazd6rczsFCHTvDLQ4dcH9BrgSwKepQcYB5VGc3' },
      { description: 'Null txID', txID: null },
      { description: 'Undefined txID', txID: undefined }
    ])('$description: $txID', async ({ txID }) => {
      await provider.platform.getTx(txID as any)
    })
  })

  describe('getTxStatus', () => {
    test.each([
      { txID: '27xs3BGknXSSKg86rczsFCHTvDLQ4dcH9BrgSwKepQcYB5VGc3' },
      { txID: '2qbN8EiGKprtFLkQxnQMgqbXSWdui5rwVUTsQp5Z5RYFphy1oK' }
    ])('Valid txID: $txID', async ({ txID }) => {
      const result = await provider.platform.getTxStatus(txID)
      expect(result.status).toBeDefined()
    })

    test.failing.each([{ description: 'Invalid txID', txID: '27xs3BGknXSSKazd6rczsFCHTvDLQ4dcH9BrgSwKepQcYB5VGc3' }])(
      '$description: $txID',
      async ({ txID }) => {
        await provider.platform.getTxStatus(txID as any)
      }
    )
  })

  describe('getValidatorsAt', () => {
    test.each([{ height: 100 }, { height: 200 }])('Valid height: $height', async ({ height }) => {
      const result = await provider.platform.getValidatorsAt(height)
      expect(result.validators).toBeDefined()
    })
  })

  describe('issueTx', () => {
    // TODO later
  })

  describe('sampleValidators', () => {
    test.each([{ size: 10 }, { size: 20 }])('Valid size: $size', async ({ size }) => {
      const result = await provider.platform.sampleValidators(size)
      expect(result.validators).toBeDefined()
    })
  })

  describe('validatedBy', () => {
    test.each([
      { blockchainID: SocotraJUNEChain.id },
      { blockchainID: '2k1EyxAV5XYPxnsuPVrKyquUTLC3EMA1c5AhM7r8sRy1Kg7Zje' }
    ])('Valid blockchainID: $blockchainID', async ({ blockchainID }) => {
      const result = await provider.platform.validatedBy(blockchainID)
      expect(result.supernetID).toBeDefined()
    })
  })

  describe('validates', () => {
    test.each([
      { supernetID: provider.mcn.primary.id },
      { supernetID: 'ZLfejkjx2AwkaNbGC7oQxX3gE6G1YLs4FzMimQEG6Us2b7UpW' }
    ])('Valid supernetID: $supernetID', async ({ supernetID }) => {
      const result = await provider.platform.validates(supernetID)
      expect(result.blockchainIDs).toBeDefined()
    })
    test.failing.each([{ description: 'Invalid supernetID', supernetID: 'INVALID_SUPERNET_ID' }])(
      '$description: $supernetID',
      async ({ supernetID }) => {
        await provider.platform.validates(supernetID as any)
      }
    )
  })
})
