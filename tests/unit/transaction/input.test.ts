import {
  AssetId,
  JuneoBuffer,
  Secp256k1Input,
  TransactionId,
  TransferableInput,
  type Serializable,
  type TransactionInput
} from '../../../src'

describe('Secp256k1Input', () => {
  test.each([

    {
      description: 'Amount min, address indices min',
      amount: BigInt(1),
      addressIndices: [0],
      expectedValue: '0000000500000000000000010000000100000000'
    },
    {
      description: 'Amount high, address indices min',
      amount: BigInt(1000000000),
      addressIndices: [0],
      expectedValue: '00000005000000003b9aca000000000100000000'
    },
    {
      description: 'Amount min, multiple address indices',
      amount: BigInt(1),
      addressIndices: [0, 1],
      expectedValue: '000000050000000000000001000000020000000000000001'
    },
    {
      description: 'Amount high, multiple address indices',
      amount: BigInt(1000000000),
      addressIndices: [0, 1],
      expectedValue: '00000005000000003b9aca00000000020000000000000001'
    },
    {
      description: 'Amount min, address indices in descending order',
      amount: BigInt(1),
      addressIndices: [2, 1],
      expectedValue: '000000050000000000000001000000020000000100000002'
    },
    {
      description: 'Amount high, address indices in descending order',
      amount: BigInt(1000000000),
      addressIndices: [2, 1],
      expectedValue: '00000005000000003b9aca00000000020000000100000002'
    },
    {
      description: 'Amount min, identical address indices',
      amount: BigInt(1),
      addressIndices: [1, 1],
      expectedValue: '000000050000000000000001000000020000000100000001'
    },
    {
      description: 'Amount high, identical address indices',
      amount: BigInt(1000000000),
      addressIndices: [1, 1],
      expectedValue: '00000005000000003b9aca00000000020000000100000001'
    },
    {
      description: 'Amount min, no address indices',
      amount: BigInt(1),
      addressIndices: [],
      expectedValue: '00000005000000000000000100000000'
    },
    {
      description: 'Amount high, no address indices',
      amount: BigInt(1000000000),
      addressIndices: [],
      expectedValue: '00000005000000003b9aca0000000000'
    }

  ])('$description',
    ({ amount, addressIndices, expectedValue }) => {
      const input = new Secp256k1Input(amount, addressIndices)
      const serialized = input.serialize()
      expect(serialized).toBeInstanceOf(JuneoBuffer)
      expect(serialized.toHex()).toBe(expectedValue)
    })
})
describe('TransferableInput', () => {
  test.each([
    {
      description: 'Basic serialization and deserialization',
      transactionId: new TransactionId('t47yA8q8dEDNxjxrQchdDoaqABC1zBrJ9aU5ZUPcfACZZynq7'),
      utxoIndex: 1,
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      input: new Secp256k1Input(BigInt(100), [1]),
      expectedSerializedValue: '73ec83f2a46db234b02280c005ddcec7a961204c5f940ec4bf342c3a50693dec000000017db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b50000000500000000000000640000000100000001'
    },
    {
      description: 'Different UTXO index',
      transactionId: new TransactionId('knnrTHQQw39XtViNgrdChyUcME7tUkMivU7HLXQf3HhNMZjHk'),
      utxoIndex: 2,
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      input: new Secp256k1Input(BigInt(200), [2]),
      expectedSerializedValue: '636ded20c23c2b2bba3a6a46ace3811da6eda26c39fe8338f94c63c31e5b6962000000027db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b50000000500000000000000c80000000100000002'
    }
  ])('$description', ({ transactionId, utxoIndex, assetId, input, expectedSerializedValue }) => {
    const transferableInput = new TransferableInput(transactionId, utxoIndex, assetId, input as TransactionInput & Serializable)
    const serialized = transferableInput.serialize()
    expect(serialized).toBeInstanceOf(JuneoBuffer)
    expect(serialized.toHex()).toBe(expectedSerializedValue)

    const deserialized = TransferableInput.parse(serialized)
    expect(deserialized.transactionId).toEqual(transactionId)
    expect(deserialized.utxoIndex).toBe(utxoIndex)
    expect(deserialized.assetId).toEqual(assetId)
    expect(deserialized.input).toEqual(input)
  })
})
