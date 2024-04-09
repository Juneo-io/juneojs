import { MCNProvider, GenesisJUNEChain, GenesisNetwork } from '../../../src'

describe('InfoAPI', () => {
  const provider: MCNProvider = new MCNProvider(GenesisNetwork)

  describe('isBootstrapped', () => {
    test.each([{ chainID: GenesisJUNEChain.id }])('Valid: $chainID', async ({ chainID }) => {
      const result = await provider.info.isBootstrapped(chainID)
      expect(result.isBootstrapped).toEqual(true)
    })
    test.failing.each([{ chainID: 'WRONG_CHAIN_ID' }])('Invalid: $chainID', async ({ chainID }) => {
      await provider.info.isBootstrapped('WRONG_CHAIN_ID')
    })
  })

  describe('getBlockchainID', () => {
    test.each([{ alias: 'JUNE' }])('Valid: $alias', async ({ alias }) => {
      const result = await provider.info.getBlockchainID(alias)
      expect(result.blockchainID).toEqual(GenesisJUNEChain.id)
    })
    test.failing.each([{ alias: 'WRONG_ALIAS' }])('Invalid: $alias', async ({ alias }) => {
      await provider.info.getBlockchainID('alias')
    })
  })

  describe('getNetworkID', () => {
    test('Returns correct network id', async () => {
      const result = await provider.info.getNetworkID()
      expect(result.networkID).toEqual(provider.mcn.id.toString())
    })
  })

  describe('getNetworkName', () => {
    test('Returns correct network name', async () => {
      const result = await provider.info.getNetworkName()
      expect(result.networkName).toEqual(provider.mcn.hrp)
    })
  })

  describe('getNodeID', () => {
    test('Returns node id', async () => {
      const result = await provider.info.getNodeID()
      expect(result).toBeDefined()
    })
  })

  describe('getNodeIP', () => {
    test('Returns node ip', async () => {
      const result = await provider.info.getNodeIP()
      expect(result).toBeDefined()
    })
  })

  describe('getNodeVersion', () => {
    test('Returns node version', async () => {
      const result = await provider.info.getNodeVersion()
      expect(result).toBeDefined()
    })
  })

  describe('getTxFee', () => {
    test('Returns fee config', async () => {
      const result = await provider.info.getTxFee()
      expect(result).toBeDefined()
    })
    test('Returns cached fee config', async () => {
      const result = await provider.info.getTxFee()
      expect(result).toBeDefined()
    })
    test('Returns updated fee config', async () => {
      const result = await provider.info.getTxFee(true)
      expect(result).toBeDefined()
    })
  })

  describe('getVMs', () => {
    test('Returns installed VMs', async () => {
      const result = await provider.info.getVMs()
      expect(result).toBeDefined()
    })
  })

  describe('peers', () => {
    test('Returns list of peers', async () => {
      const result = await provider.info.peers()
      expect(result).toBeDefined()
    })
    test.failing.each([
      { nodeIDs: ['WRONG_NODE_ID', 'NodeID-P1ESFUf8tutmR8hszZUWsXAJEKARZ5SPw'] },
      { nodeIDs: ['NodeID-P1ESFUf8tutmR8hszZUWsXAJEKARZ5SPa'] }
    ])('Invalid: $nodeIDs', async ({ nodeIDs }) => {
      await provider.info.peers(nodeIDs)
    })
  })

  describe('uptime', () => {
    test.each([{ supernetID: undefined }, { supernetID: provider.mcn.primary.id }])(
      'Valid: $supernetID',
      async ({ supernetID }) => {
        const result = await provider.info.uptime(supernetID)
        expect(result).toBeDefined()
      }
    )
    test.failing.each([{ supernetID: 'WRONG_SUPERNET_ID' }])('Invalid: $supernetID', async ({ supernetID }) => {
      await provider.info.uptime(supernetID)
    })
  })
})
