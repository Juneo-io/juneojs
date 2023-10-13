import * as dotenv from 'dotenv'
import { MCNWallet, SocotraJUNEChain, SocotraPlatformChain, WalletError, validatePrivateKey } from '../../../src'
dotenv.config()

describe('MCNWallet', (): void => {
  describe('Generate', (): void => {
    test('Defaults to 12 words', () => {
      const wallet = MCNWallet.generate()
      expect(wallet.mnemonic).toBeDefined()
      expect(wallet.mnemonic?.split(' ').length).toBe(12)
    })

    describe('Valid words count', (): void => {
      test.each([[12], [24]])('%i words', (wordsCount) => {
        const wallet = MCNWallet.generate(wordsCount)
        expect(wallet.mnemonic).toBeDefined()
        expect(wallet.mnemonic?.split(' ').length).toBe(wordsCount)
      })
    })

    describe('Invalid words count', (): void => {
      test.each([[0], [11], [13], [25]])('%i words', (wordsCount) => {
        expect(() => {
          MCNWallet.generate(wordsCount)
        }).toThrow(WalletError)
      })
    })
  })

  describe('Recover', (): void => {
    describe('Valid mnemonic', (): void => {
      test.each([['energy correct expire mistake find pair tuna blouse album pig become help']])('%s', (words) => {
        const wallet = MCNWallet.recover(words)
        expect(wallet.mnemonic).toBeDefined()
        expect(wallet.mnemonic).toBe(words)
      })
    })

    describe('Invalid mnemonic', (): void => {
      test.each([['lounge flush donate journey throw harvest morning brut few juice red rare']])('%s', (words) => {
        expect(() => {
          MCNWallet.recover(words)
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

  // TODO refactor to test get address of given chain type
  // e.g. Get address from JVM Chain / from Platform Chain / from JEVM Chain
  test('Should get an address for a given chain', () => {
    // valid
    const wallet = MCNWallet.generate(12)
    const address = wallet.getAddress(SocotraJUNEChain)
    expect(address).toBeDefined()
  })

  // TODO refactor to test get wallet of given chain type
  // e.g. Get wallet from JVM Chain / from Platform Chain / from JEVM Chain
  test('Should get a chain wallet', () => {
    // valid
    const wallet = MCNWallet.generate(12)
    const chainWallet = wallet.getWallet(SocotraJUNEChain)
    expect(chainWallet).toBeDefined()
  })

  test('Should get all chain wallets', () => {
    // valid
    const wallet = MCNWallet.generate(12)
    wallet.getAddress(SocotraJUNEChain)
    wallet.getAddress(SocotraPlatformChain)
    const wallets = wallet.getWallets()
    expect(wallets.length).toBe(2)
  })
})
