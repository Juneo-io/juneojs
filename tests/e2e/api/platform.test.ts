import { MCNProvider, SocotraBCH1Chain, SocotraJUNEChain, type GetBlockResponse } from '../../../src'

describe('PlatformAPI tests', () => {
  const provider: MCNProvider = new MCNProvider()

  describe('getBlock', () => {
    test.each([
      ['Be defined for valid blockID', '2qbN8EiGKprtFLkQxnQMgqbXSWdui5rwVUTsQp5Z5RYFphy1oK'],
      ['Be defined for another valid blockID', '2K8nAXkMwgnJRCFMAS7KiJSkBbDYKtFP6JH7ww2YiAjg6XnN69']
    ])('%s', async (description, blockID) => {
      const result: GetBlockResponse = await provider.platform.getBlock(blockID)
      expect(result.block).toBeDefined()
      expect(result.encoding).toBeDefined()
    })

    test.failing.each([
      ['Invalid blockID', 'invalidBlockID'],
      ['Handle null input', null],
      ['Handle undefined input', undefined]
    ])('%s', async (description, blockID) => {
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
      ['Be defined for valid blockchainID', SocotraJUNEChain.id],
      ['Be defined for another valid blockchainID', SocotraBCH1Chain.id],
      ['Be defined for another valid blockchainID', '2k1EyxAV5XYPxnsuPVrKyquUTLC3EMA1c5AhM7r8sRy1Kg7Zje']
    ])('%s', async (description, blockchainID) => {
      const result = await provider.platform.getBlockchainStatus(blockchainID)
      expect(result.status).toBeDefined()
    })

    test.failing.each([
      ['Invalid blockchainID', 'invalidBlockchainID'],
      ['Handle null input', null],
      ['Handle undefined input', undefined]
    ])('%s', async (description, blockchainID) => {
      await provider.platform.getBlockchainStatus(blockchainID as any)
    })
  })

  describe('getCurrentSupply', () => {
    test('should return current supply', async () => {
      const result = await provider.platform.getCurrentSupply()
      expect(result.supply).toBeDefined()
    })
  })

  describe('getCurrentValidators', () => {
    test.each([
      ['Without supernetID and nodeIDs', undefined, undefined],
      ['With supernetID', 'ZLfejkjx2AwkaNbGC7oQxX3gE6G1YLs4FzMimQEG6Us2b7UpW', undefined],
      ['With nodeIDs', undefined, ['NodeID-B2GHMQ8GF6FyrvmPUX6miaGeuVLH9UwHr', 'NodeID-JttGf5ixpbpuT4xXB8owDBBpDgtRpV1p3']]
    ])('%s', async (description, supernetID, nodeIDs) => {
      const result = await provider.platform.getCurrentValidators(supernetID, nodeIDs)
      expect(result.validators).toBeDefined()
    })

    test.failing.each([
      ['Invalid supernetID', 'invalidSupernetID', undefined],
      ['Invalid nodeIDs', undefined, ['invalidNodeID', 'invalidNodeID2']]
    ])('%s', async (description, supernetID, nodeIDs) => {
      await provider.platform.getCurrentValidators(supernetID as any, nodeIDs as any)
    })
  })

  describe('getHeight', () => {
    test('should return blockchain height', async () => {
      const result = await provider.platform.getHeight()
      expect(result.height).toBeDefined()
    })
  })

  describe('getMinStake', () => {
    test.each([
      ['Minimum stake without supernetID', undefined],
      ['Minimum stake with supernetID', provider.mcn.primary.id]

    ])('%s', async (description, supernetID) => {
      const result = await provider.platform.getMinStake(supernetID)
      expect(result.minDelegatorStake).toBeDefined()
      expect(result.minValidatorStake).toBeDefined()
    })

    test.failing.each([
      ['Invalid supernetID', 'invalidSupernetID'],
      ['Minimum stake for permissionned supernetID', 'ZLfejkjx2AwkaNbGC7oQxX3gE6G1YLs4FzMimQEG6Us2b7UpW']
    ])('%s', async (description, supernetID) => {
      await provider.platform.getMinStake(supernetID as any)
    })
  })

  describe('getPendingValidators', () => {
    test.each([
      ['Pending validators without supernetID and nodeIDs', undefined, undefined],
      ['Pending validators with supernetID', provider.mcn.primary.id, undefined],
      ['Pending validators with nodeIDs', undefined, ['NodeID-B2GHMQ8GF6FyrvmPUX6miaGeuVLH9UwHr', 'NodeID-JttGf5ixpbpuT4xXB8owDBBpDgtRpV1p3']]
    ])('%s', async (description, supernetID, nodeIDs) => {
      const result = await provider.platform.getPendingValidators(supernetID, nodeIDs)
      expect(result.delegators).toBeDefined()
      expect(result.validators).toBeDefined()
    })

    test.failing.each([
      ['Invalid supernetID', 'invalidSupernetID', undefined],
      ['Invalid nodeIDs', undefined, ['invalidNodeID', 'invalidNodeID2']]
    ])('%s', async (description, supernetID, nodeIDs) => {
      await provider.platform.getPendingValidators(supernetID as any, nodeIDs as any)
    })
  })

  describe('getStakingAssetID', () => {
    test.each([
      ['Staking asset ID without supernetID', undefined],
      ['Staking asset ID with supernetID', provider.mcn.primary.id]
    ])('%s', async (description, supernetID) => {
      const result = await provider.platform.getStakingAssetID(supernetID)
      expect(result.assetID).toBeDefined()
    })

    test.failing.each([
      ['Invalid supernetID', 'invalidSupernetID']
    ])('%s', async (description, supernetID) => {
      await provider.platform.getStakingAssetID(supernetID as any)
    })
  })

  describe('getSupernets', () => {
    //  Deprecated
  })

  describe('getTimestamp', () => {
    test('should return current timestamp', async () => {
      const result = await provider.platform.getTimestamp()

      //  TODO change to timestamp
      // expect(result.timestamp).toBeDefined()

      expect(result).toBeDefined()
    })
  })

  describe('getTotalStake', () => {
    test.each([
      ['Total stake for given supernetID', provider.mcn.primary.id]
    ])('%s', async (description, supernetID) => {
      const result = await provider.platform.getTotalStake(supernetID)
      expect(result.stake).toBeDefined()
      expect(result.weight).toBeDefined()
    })

    test.failing.each([
      ['Invalid supernetID', 'invalidSupernetID'],
      ['Total stake for permissionned supernetID', 'ZLfejkjx2AwkaNbGC7oQxX3gE6G1YLs4FzMimQEG6Us2b7UpW']
    ])('%s', async (description, supernetID) => {
      await provider.platform.getTotalStake(supernetID as any)
    })
  })

  describe('getTx', () => {
    test.each([
      ['Be defined for valid txID', '2tCUnxobnWD6PgRMVaBJt6uiUxk9NcjLU6Emczbj64GF7dnkcp'],
      ['Be defined for another valid txID', '27xs3BGknXSSKg86rczsFCHTvDLQ4dcH9BrgSwKepQcYB5VGc3']
    ])('%s', async (description, txID) => {
      const result = await provider.platform.getTx(txID)
      expect(result.encoding).toBeDefined()
      expect(result.tx).toBeDefined()
    })

    test.failing.each([
      ['Handle invalid txID', '27xs3BGknXSSKazd6rczsFCHTvDLQ4dcH9BrgSwKepQcYB5VGc3'],
      ['Handle null input', null],
      ['Handle undefined input', undefined]
    ])('%s', async (description, txID) => {
      await provider.platform.getTx(txID as any)
    })
  })

  describe('getTxStatus', () => {
    test.each([
      ['Status for valid txID', '27xs3BGknXSSKg86rczsFCHTvDLQ4dcH9BrgSwKepQcYB5VGc3'],
      ['Status for another valid txID', '2qbN8EiGKprtFLkQxnQMgqbXSWdui5rwVUTsQp5Z5RYFphy1oK']
    ])('%s', async (description, txID) => {
      const result = await provider.platform.getTxStatus(txID)
      expect(result.status).toBeDefined()
    })

    test.failing.each([
      ['Handle invalid txID', '27xs3BGknXSSKazd6rczsFCHTvDLQ4dcH9BrgSwKepQcYB5VGc3']
    ])('%s', async (description, txID) => {
      await provider.platform.getTxStatus(txID as any)
    })
  })

  describe('getValidatorsAt', () => {
    test.each([
      ['Validators for given height', 100],
      ['Validators for another height', 200]
    ])('%s', async (description, height) => {
      const result = await provider.platform.getValidatorsAt(height)
      expect(result.validators).toBeDefined()
    })
  })

  describe('issueTx', () => {
    // TODO later
  })

  describe('sampleValidators', () => {
    test.each([
      ['Validators for given size', 10],
      ['Validators for another size', 20]
    ])('%s', async (description, size) => {
      const result = await provider.platform.sampleValidators(size)
      expect(result.validators).toBeDefined()
    })
  })

  describe('validatedBy', () => {
    test.each([
      ['ValidatedBy for given blockchainID', SocotraJUNEChain.id],
      ['ValidatedBy for another blockchainID', '2k1EyxAV5XYPxnsuPVrKyquUTLC3EMA1c5AhM7r8sRy1Kg7Zje']
    ])('%s', async (description, blockchainID) => {
      const result = await provider.platform.validatedBy(blockchainID)
      expect(result.supernetID).toBeDefined()
    })
  })

  describe('validates', () => {
    test.each([
      ['Validates for given supernetID', provider.mcn.primary.id],
      ['Validates for another supernetID', 'ZLfejkjx2AwkaNbGC7oQxX3gE6G1YLs4FzMimQEG6Us2b7UpW']
    ])('%s', async (description, supernetID) => {
      const result = await provider.platform.validates(supernetID)
      expect(result.blockchainIDs).toBeDefined()
    })
    test.failing.each([
      ['Invalid supernetID', 'invalidSupernetID']
    ])('%s', async (description, supernetID) => {
      await provider.platform.validates(supernetID as any)
    })
  })
})
