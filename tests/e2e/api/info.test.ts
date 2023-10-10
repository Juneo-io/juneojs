import { MCNProvider, SocotraJUNEChain, SocotraNetwork } from '../../../src'

describe('InfoAPI tests', () => {
  const provider: MCNProvider = new MCNProvider()

  describe('isBootstrapped', () => {
    test('Return true for a bootstrapped chain', async () => {
      const result = await provider.info.isBootstrapped(SocotraJUNEChain.id)
      expect(result.isBootstrapped).toEqual(true)
    })
    test.failing('Wrong chain id', async () => {
      await provider.info.isBootstrapped('WrongChainId')
    })
  })

  describe('getBlockchainID', () => {
    test('Return correct Blockchain ID', async () => {
      const result = await provider.info.getBlockchainID('JUNE')
      expect(result.blockchainID).toEqual(SocotraJUNEChain.id)
    })
    test.failing('Not return correct Blockchain ID', async () => {
      await provider.info.getBlockchainID('WrongAlias')
    })
  })

  describe('getNetworkID', () => {
    test('Return correct Network ID', async () => {
      const result = await provider.info.getNetworkID()
      expect(result.networkID).toEqual((SocotraNetwork.id).toString())
    })
  })

  describe('getNetworkName', () => {
    test('Return correct Network Name', async () => {
      const result = await provider.info.getNetworkName()
      expect(result.networkName).toEqual('socotra')
    })
  })

  describe('getNodeID', () => {
    test('Return correct Node ID', async () => {
      const result = await provider.info.getNodeID()
      expect((result)).toBeDefined()
    })
  })

  describe('getNodeIP', () => {
    test('Return correct Node IP', async () => {
      const result = await provider.info.getNodeIP()
      expect(result).toBeDefined()
    })
  })

  describe('getNodeVersion', () => {
    test('Return correct Node Version', async () => {
      const result = await provider.info.getNodeVersion()
      expect(result).toBeDefined()
    })
  })

  describe('getTxFee', () => {
    test('Return correct Transaction Fee', async () => {
      const result = await provider.info.getTxFee()
      expect(result).toBeDefined()
    })
    test('Return correct Transaction Fee force update', async () => {
      const result = await provider.info.getTxFee(true)
      expect(result).toBeDefined()
    })
  })

  describe('getVMs', () => {
    test('Return correct list of VMs', async () => {
      const result = await provider.info.getVMs()
      expect(result).toBeDefined()
    })
  })

  describe('peers', () => {
    test('Return correct list of peers', async () => {
      const result = await provider.info.peers()
      expect(result).toBeDefined()
    })
    test.failing('Wrong node id', async () => {
      await provider.info.peers(['WrongNodeId', 'NodeID-P1ESFUf8tutmR8hszZUWsXAJEKARZ5SPw'])
    })
    test.failing('Wrong node id', async () => {
      await provider.info.peers(['NodeID-P1ESFUf8tutmR8hszZUWsXAJEKARZ5SPa'])
    })
  })

  describe('uptime', () => {
    test('Return correct uptime information', async () => {
      const result = await provider.info.uptime()
      expect(result).toBeDefined()
    })
    test.failing('Wrong supernet id', async () => {
      await provider.info.uptime('WrongSupernetId')
    })
  })
})
