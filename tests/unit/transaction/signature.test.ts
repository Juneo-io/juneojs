import {
  Address,
  AssetId,
  buildJVMBaseTransaction,
  MCNWallet,
  Secp256k1Output,
  SignedTransaction,
  SocotraJVMChain,
  TransactionId,
  UserInput,
  Utxo
} from '../../../src'

const JVM_CHAIN = SocotraJVMChain
const ZERO_CB58 = '11111111111111111111111111111111LpoYY'
const WALLET_A = MCNWallet.recover('rescue shoe prevent wasp close crash grief web lesson rich baby replace')
const WALLET_A_ADDRESS = WALLET_A.getAddress(JVM_CHAIN)
const WALLET_B = MCNWallet.recover('midnight spider novel juice pizza couple marine anger echo boost loan glare')
const WALLET_B_ADDRESS = WALLET_B.getAddress(JVM_CHAIN)

describe('SignedTransaction valid signatures verification', () => {
  test.each([
    {
      description: 'One utxo one address',
      inputs: [new UserInput(ZERO_CB58, JVM_CHAIN, BigInt(1), [WALLET_A_ADDRESS], 1, JVM_CHAIN, BigInt(0))],
      utxos: [
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(1), BigInt(0), 1, [new Address(WALLET_A_ADDRESS)])
        )
      ],
      senders: [WALLET_A_ADDRESS],
      signers: [WALLET_A.getWallet(JVM_CHAIN)]
    },
    {
      description: 'Two utxos one address',
      inputs: [new UserInput(ZERO_CB58, JVM_CHAIN, BigInt(2), [WALLET_A_ADDRESS], 1, JVM_CHAIN, BigInt(0))],
      utxos: [
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(1), BigInt(0), 1, [new Address(WALLET_A_ADDRESS)])
        ),
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(1), BigInt(0), 1, [new Address(WALLET_A_ADDRESS)])
        )
      ],
      senders: [WALLET_A_ADDRESS],
      signers: [WALLET_A.getWallet(JVM_CHAIN)]
    },
    {
      description: 'One utxo two addresses',
      inputs: [new UserInput(ZERO_CB58, JVM_CHAIN, BigInt(2), [WALLET_A_ADDRESS], 1, JVM_CHAIN, BigInt(0))],
      utxos: [
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(2), BigInt(0), 2, [new Address(WALLET_A_ADDRESS), new Address(WALLET_B_ADDRESS)])
        )
      ],
      senders: [WALLET_A_ADDRESS, WALLET_B_ADDRESS],
      signers: [WALLET_A.getWallet(JVM_CHAIN), WALLET_B.getWallet(JVM_CHAIN)]
    }
  ])('$description', async ({ inputs, utxos, senders, signers }) => {
    const baseTx = buildJVMBaseTransaction(inputs, utxos, senders, BigInt(0), WALLET_A_ADDRESS, 12345)
    const signedTx = new SignedTransaction(baseTx, await baseTx.sign(signers))
    expect(signedTx.verifySignatures().length).toBe(0)
  })
})

describe('SignedTransaction invalid signatures verification', () => {
  test.each([
    {
      description: 'One utxo one address wrong signers',
      inputs: [new UserInput(ZERO_CB58, JVM_CHAIN, BigInt(1), [WALLET_A_ADDRESS], 1, JVM_CHAIN, BigInt(0))],
      utxos: [
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(1), BigInt(0), 1, [new Address(WALLET_A_ADDRESS)])
        )
      ],
      senders: [WALLET_A_ADDRESS],
      signers: [WALLET_B.getWallet(JVM_CHAIN)],
      expectedLength: 1
    },
    {
      description: 'One utxo one address no signers',
      inputs: [new UserInput(ZERO_CB58, JVM_CHAIN, BigInt(1), [WALLET_A_ADDRESS], 1, JVM_CHAIN, BigInt(0))],
      utxos: [
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(1), BigInt(0), 1, [new Address(WALLET_A_ADDRESS)])
        )
      ],
      senders: [WALLET_A_ADDRESS],
      signers: [],
      expectedLength: 1
    },
    {
      description: 'Two utxos one address wrong signers',
      inputs: [new UserInput(ZERO_CB58, JVM_CHAIN, BigInt(2), [WALLET_A_ADDRESS], 1, JVM_CHAIN, BigInt(0))],
      utxos: [
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(1), BigInt(0), 1, [new Address(WALLET_A_ADDRESS)])
        ),
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(1), BigInt(0), 1, [new Address(WALLET_A_ADDRESS)])
        )
      ],
      senders: [WALLET_A_ADDRESS],
      signers: [WALLET_B.getWallet(JVM_CHAIN)],
      expectedLength: 1
    },
    {
      description: 'Two utxos one address no signers',
      inputs: [new UserInput(ZERO_CB58, JVM_CHAIN, BigInt(2), [WALLET_A_ADDRESS], 1, JVM_CHAIN, BigInt(0))],
      utxos: [
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(1), BigInt(0), 1, [new Address(WALLET_A_ADDRESS)])
        ),
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(1), BigInt(0), 1, [new Address(WALLET_A_ADDRESS)])
        )
      ],
      senders: [WALLET_A_ADDRESS],
      signers: [],
      expectedLength: 1
    },
    {
      description: 'One utxo two addresses one out for two signers',
      inputs: [new UserInput(ZERO_CB58, JVM_CHAIN, BigInt(2), [WALLET_A_ADDRESS], 1, JVM_CHAIN, BigInt(0))],
      utxos: [
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(2), BigInt(0), 2, [new Address(WALLET_A_ADDRESS), new Address(WALLET_B_ADDRESS)])
        )
      ],
      senders: [WALLET_A_ADDRESS, WALLET_B_ADDRESS],
      signers: [WALLET_A.getWallet(JVM_CHAIN)],
      expectedLength: 1
    },
    {
      description: 'One utxo two addresses no signers',
      inputs: [new UserInput(ZERO_CB58, JVM_CHAIN, BigInt(2), [WALLET_A_ADDRESS], 1, JVM_CHAIN, BigInt(0))],
      utxos: [
        new Utxo(
          new TransactionId(ZERO_CB58),
          0,
          new AssetId(ZERO_CB58),
          new Secp256k1Output(BigInt(2), BigInt(0), 2, [new Address(WALLET_A_ADDRESS), new Address(WALLET_B_ADDRESS)])
        )
      ],
      senders: [WALLET_A_ADDRESS, WALLET_B_ADDRESS],
      signers: [],
      expectedLength: 2
    }
  ])('$description', async ({ inputs, utxos, senders, signers, expectedLength }) => {
    const baseTx = buildJVMBaseTransaction(inputs, utxos, senders, BigInt(0), WALLET_A_ADDRESS, 12345)
    const signedTx = new SignedTransaction(baseTx, await baseTx.sign(signers))
    expect(signedTx.verifySignatures().length).toBe(expectedLength)
  })
})

describe('Secp256k1Credentials', () => {
  test.todo('should serialize correctly')
})

describe('SignedTransaction', () => {
  test.each([
    {
      description: 'Parsing from PlatformAPI CreateSupernetTx',
      data: '0x0000000000100000002e000000000000000000000000000000000000000000000000000000000000000000000001266ecea3035b1435f5cbb17dfc33cc1f4e9b058677915cc52c7ccfae1507b563000000070000000002734dd8000000000000000000000001000000011083871f7bf3d99e3e698b4fd3823093ea8f0b92000000020741f8b3c333ae6581a815090cf000b8c0187d8db4413f2b38576b10d1519fbe00000000266ecea3035b1435f5cbb17dfc33cc1f4e9b058677915cc52c7ccfae1507b5630000000500000000069f6b5800000001000000008e40067cedaa247f21a9505f37cf18867c8c3bc632b77e314ac7e43bc9b7197900000000266ecea3035b1435f5cbb17dfc33cc1f4e9b058677915cc52c7ccfae1507b563000000050000000001c9c3800000000100000000000000000000000b000000000000000000000001000000011083871f7bf3d99e3e698b4fd3823093ea8f0b92000000020000000900000001a33d56e4797f207c56ec27c6b5ae5a3c6f11cc4d5dd790287f40728d82ecc26e0ea1ee8f08f25c8722b895a77c3da6fdc6d76c2243eb7435f35ed924443a1248010000000900000001a33d56e4797f207c56ec27c6b5ae5a3c6f11cc4d5dd790287f40728d82ecc26e0ea1ee8f08f25c8722b895a77c3da6fdc6d76c2243eb7435f35ed924443a124801d92ab042'
    }
  ])('$description', async ({ data }) => {
    const parsed = SignedTransaction.parse(data)
    expect(parsed).toBeInstanceOf(SignedTransaction)
  })
})
