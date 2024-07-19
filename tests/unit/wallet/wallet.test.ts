import {
  GenesisJUNEChain,
  GenesisJVMChain,
  GenesisPlatformChain,
  MCNWallet,
  MainNetwork,
  SocotraNetwork,
  WalletError,
  validatePrivateKey
} from '../../../src'

describe('MCNWallet', (): void => {
  describe('Generate', (): void => {
    describe('Valid words count', (): void => {
      test.each([[12], [15], [18], [21], [24]])('%i words', (wordsCount) => {
        const wallet = new MCNWallet(SocotraNetwork.hrp, wordsCount)
        expect(wallet.mnemonic).toBeDefined()
        expect(wallet.mnemonic!.split(' ').length).toBe(wordsCount)
      })
    })

    describe('Invalid words count', (): void => {
      test.each([[0], [11], [13], [25]])('%i words', (wordsCount) => {
        expect(() => {
          const wallet = new MCNWallet(SocotraNetwork.hrp, wordsCount)
          wallet.setHrp(MainNetwork.hrp)
        }).toThrow(WalletError)
      })
    })
  })

  describe('Recover', (): void => {
    describe('Valid mnemonic', (): void => {
      test.each([['energy correct expire mistake find pair tuna blouse album pig become help']])('%s', (words) => {
        const wallet = new MCNWallet(SocotraNetwork.hrp, words)
        expect(wallet.mnemonic).toBeDefined()
        expect(wallet.mnemonic).toBe(words)
      })
    })

    describe('Invalid mnemonic', (): void => {
      test.each([['lounge flush donate journey throw harvest morning brut few juice red rare']])('%s', (words) => {
        expect(() => {
          const wallet = new MCNWallet(SocotraNetwork.hrp, words)
          wallet.setHrp(MainNetwork.hrp)
        }).toThrow(WalletError)
      })
    })
  })

  // private key validation should be moved to utils testing
  test.each([['06b5fcd14cae2211e884a0914b6f81c0458a90aefae8cf317bf09e9cd057164b']])(
    'Validate hex private key',
    (privateKey) => {
      expect(validatePrivateKey(privateKey)).toBe(true)
    }
  )

  test.failing.each([['06b5fcd14cae2211e884a0914b6f81c0458a90efae8cf317bf09e9cd057164c']])(
    'Validate invalid hex private key',
    (privateKey) => {
      expect(validatePrivateKey(privateKey)).toBe(true)
    }
  )

  describe('getAddress', () => {
    test.each([
      {
        mnemonic: 'install melt spy tiny dose spot close van oven sibling misery symptom',
        chain: GenesisJVMChain,
        address: 'JVM-socotra17p4punu4589yqfzgv044tl546dnwvf2pd2k6j4'
      },
      {
        mnemonic: 'install melt spy tiny dose spot close van oven sibling misery symptom',
        chain: GenesisJUNEChain,
        address: '0xf44b80bf950058b087F47d88fDB71686c4beFef8'
      }
    ])('$chain.name address: $address', ({ mnemonic, chain, address }): void => {
      const wallet: MCNWallet = new MCNWallet(SocotraNetwork.hrp, mnemonic)
      expect(wallet.getAddress(chain)).toBe(address)
    })
  })

  describe('getWallet', () => {
    test.each([
      {
        mnemonic: 'install melt spy tiny dose spot close van oven sibling misery symptom',
        chain: GenesisJVMChain
      },
      {
        mnemonic: 'install melt spy tiny dose spot close van oven sibling misery symptom',
        chain: GenesisJUNEChain
      }
    ])('$chain.name wallet from: $mnemonic', ({ mnemonic, chain }): void => {
      const wallet: MCNWallet = new MCNWallet(SocotraNetwork.hrp, mnemonic)
      expect(wallet.getWallet(chain)).toBeDefined()
    })
  })

  test('getWallets', () => {
    const wallet = new MCNWallet(SocotraNetwork.hrp, 12)
    wallet.getAddress(GenesisJUNEChain)
    wallet.getAddress(GenesisPlatformChain)
    const wallets = wallet.getWallets()
    expect(wallets.length).toBe(2)
  })
})
