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
  ])('$description', ({ amount, addressIndices, expectedValue }) => {
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
      expectedSerializedValue:
        '73ec83f2a46db234b02280c005ddcec7a961204c5f940ec4bf342c3a50693dec000000017db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b50000000500000000000000640000000100000001'
    },
    {
      description: 'Different UTXO index',
      transactionId: new TransactionId('knnrTHQQw39XtViNgrdChyUcME7tUkMivU7HLXQf3HhNMZjHk'),
      utxoIndex: 2,
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      input: new Secp256k1Input(BigInt(200), [2]),
      expectedSerializedValue:
        '636ded20c23c2b2bba3a6a46ace3811da6eda26c39fe8338f94c63c31e5b6962000000027db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b50000000500000000000000c80000000100000002'
    },
    {
      description: 'Multiple address indices',
      transactionId: new TransactionId('tYsq6e6ppF91b1PoYKN2iEo69X7aMJRJyv85jcb6vi2QKs21W'),
      utxoIndex: 3,
      assetId: new AssetId('fawNQXm5Q8AzyvuvASN1NfvYuqqmvr55WQeD8ZibJz6Q12WP4'),
      input: new Secp256k1Input(BigInt(300), [1, 2]),
      expectedSerializedValue:
        '750cb6424ff20ce3af51d1e79c4f70436de20cea2fffb8a370e1e191fdad04ce00000003579cbc918f783fe6a7fd30e0b7210ad7cbdbbd1808c2ba7c835a1a96cf5d7e1700000005000000000000012c000000020000000100000002'
    },
    {
      description: 'Zero UTXO index',
      transactionId: new TransactionId('2kArSUBdZGoRMDBvoZLyGGdK3yoVjtsTV3GWHSsic6GRVMuArH'),
      utxoIndex: 0,
      assetId: new AssetId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      input: new Secp256k1Input(BigInt(400), [3]),
      expectedSerializedValue:
        'e5b7f3ccdca9f8785bc2332964f2c8186ac22b98879397e32ff6cbc261d4aa5900000000d28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a050000000500000000000001900000000100000003'
    },
    {
      description: 'Empty address indices',
      transactionId: new TransactionId('gS845TcHmTDPMDU8z9E2bAZ7ujp9F7CAReQqCvSZh1Pvb6mGH'),
      utxoIndex: 4,
      assetId: new AssetId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      input: new Secp256k1Input(BigInt(0), []),
      expectedSerializedValue:
        '5989a9dcfbdd73148a327e867954a3876755f84a6c8049088dacc5d070eb40fb00000004d28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a0500000005000000000000000000000000'
    },
    {
      description: 'High amount',
      transactionId: new TransactionId('tYsq6e6ppF91b1PoYKN2iEo69X7aMJRJyv85jcb6vi2QKs21W'),
      utxoIndex: 6,
      assetId: new AssetId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      input: new Secp256k1Input(BigInt('9007199254740991'), [5]),
      expectedSerializedValue:
        '750cb6424ff20ce3af51d1e79c4f70436de20cea2fffb8a370e1e191fdad04ce00000006d28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a0500000005001fffffffffffff0000000100000005'
    },
    {
      description: 'Multiple address indices with high amount',
      transactionId: new TransactionId('gS845TcHmTDPMDU8z9E2bAZ7ujp9F7CAReQqCvSZh1Pvb6mGH'),
      utxoIndex: 7,
      assetId: new AssetId('XgN1Q8XeEuj9SU5UtM2LtNWsufgrz6amVs8BwGcJZM7ZuarNq'),
      input: new Secp256k1Input(BigInt('9007199254740991'), [5, 6]),
      expectedSerializedValue:
        '5989a9dcfbdd73148a327e867954a3876755f84a6c8049088dacc5d070eb40fb0000000745a8de9ee8e1300fa74cd67b462c2eaf93faa7f415645ebaddfe936e5cf56f9300000005001fffffffffffff000000020000000500000006'
    },
    {
      description: 'Zero amount with multiple address indices',
      transactionId: new TransactionId('qp19AULkpQwGwPJpfkMjytCzfyM3Bm3pMwBXfQmNbgimzutJQ'),
      utxoIndex: 8,
      assetId: new AssetId('XgN1Q8XeEuj9SU5UtM2LtNWsufgrz6amVs8BwGcJZM7ZuarNq'),
      input: new Secp256k1Input(BigInt(0), [7, 8]),
      expectedSerializedValue:
        '6ed477de5bee3b3d5813b341e249b1b48747ef2c3bcce716cafeb2f43fb7031a0000000845a8de9ee8e1300fa74cd67b462c2eaf93faa7f415645ebaddfe936e5cf56f93000000050000000000000000000000020000000700000008'
    }
  ])('$description', ({ transactionId, utxoIndex, assetId, input, expectedSerializedValue }) => {
    const transferableInput = new TransferableInput(
      transactionId,
      utxoIndex,
      assetId,
      input as TransactionInput & Serializable
    )
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
