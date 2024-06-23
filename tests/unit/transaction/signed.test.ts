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
