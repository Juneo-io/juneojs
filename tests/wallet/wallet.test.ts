
import * as dotenv from 'dotenv';
import { MCNWallet, SocotraJUNEChain, SocotraPlatformChain } from '../../src/index';
dotenv.config()

describe('Wallet', (): void => {
  test('Should generate a wallet with 12 words without provide argument', () => {
    // valid
    const wallet = MCNWallet.generate();
    expect(wallet).toBeDefined();
    expect(wallet.mnemonic?.split(' ').length).toBe(12);
  });

  test('Should generate a wallet with 12 words', () => {
    // valid
    const wallet = MCNWallet.generate(12);
    expect(wallet).toBeDefined();
    expect(wallet.mnemonic?.split(' ').length).toBe(12);
  });

  test('Should generate a wallet with 24 words', () => {
    // valid
    const wallet = MCNWallet.generate(24);
    expect(wallet).toBeDefined();
    expect(wallet.mnemonic?.split(' ').length).toBe(24);
  });

  test('Should recover a wallet from a valid mnemonic', () => {
    // valid
    const validMnemonic = process.env.MNEMONIC ?? '';
    const wallet = MCNWallet.recover(validMnemonic);
    expect(wallet).toBeDefined();
    expect(wallet.mnemonic).toBe(validMnemonic);
  });

  test('Should throw an error for invalid mnemonic', () => {
    // invalid
    const invalidMnemonic = 'lounge flush donate journey throw harvest morning brut few juice red rare';
    expect(() => {
      MCNWallet.recover(invalidMnemonic);
    }).toThrow('invalid recovery data provided');
  });

  test('Should throw an error for invalid word count', () => {
    // invalid
    expect(() => {
      MCNWallet.generate(15);
    }).toThrow('words count must be 12 or 24');
  });

  test('Should validate a private key', () => {
    // valid
    const validPrivateKey = '06b5fcd14cae2211e884a0914b6f81c0458a90aefae8cf317bf09e9cd057164b';
    const isValid = MCNWallet.validatePrivateKey(validPrivateKey);
    expect(isValid).toBe(true);
  });
  
  test('Should invalidate a private key', () => {
    // invalid
    const invalidPrivateKey = '06b5fcd14cae2211e884a0914b6f81c0458a90efae8cf317bf09e9cd057164c';
    const isValid = MCNWallet.validatePrivateKey(invalidPrivateKey);
    expect(isValid).toBe(false);
  });

  test('Should get an address for a given chain', () => {
    // valid
    const wallet = MCNWallet.generate(12);
    const address = wallet.getAddress(SocotraJUNEChain);
    expect(address).toBeDefined();
  });

  test('Should get a chain wallet', () => {
    // valid
    const wallet = MCNWallet.generate(12);
    const chainWallet = wallet.getWallet(SocotraJUNEChain);
    expect(chainWallet).toBeDefined();
  });

  test('Should get all chain wallets', () => {
    // valid
    const wallet = MCNWallet.generate(12);
    wallet.getAddress(SocotraJUNEChain);
    wallet.getAddress(SocotraPlatformChain);
  
    const wallets = wallet.getWallets();
    expect(wallets.length).toBe(2);
  });
  
}
);