import { Address, AssetId, JuneoBuffer, Secp256k1Output, TransferableOutput } from '../../../src'

describe('TransferableOutput', () => {
  test.each([
    {
      description: 'should serialize correctly for amount 100 and address 0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E',
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      output: new Secp256k1Output(BigInt(100), BigInt(0), 1, [new Address('0xc0ffee254729296a45a3885639AC7E10F9d54979')]),
      expectedValue: '7db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b500000007000000000000006400000000000000000000000100000001c0ffee254729296a45a3885639ac7e10f9d54979'
    },
    {
      description: 'should serialize correctly for amount 0',
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      output: new Secp256k1Output(BigInt(200), BigInt(10), 2, [
        new Address('0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E'),
        new Address('0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E')
      ]),
      expectedValue: '7db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b50000000700000000000000c8000000000000000a0000000200000002888888cf1046e68e36e1aa2e0e07105eddd1f08e999999cf1046e68e36e1aa2e0e07105eddd1f08e'
    },
    {
      description: 'Amount min, locktime min, threshold min',
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      output: new Secp256k1Output(BigInt(1), BigInt(0), 1, [new Address('0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E')]),
      expectedValue: '7db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b500000007000000000000000100000000000000000000000100000001888888cf1046e68e36e1aa2e0e07105eddd1f08e'
    },
    {
      description: 'Amount élevé, locktime min, threshold min',
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      output: new Secp256k1Output(BigInt(1000000000), BigInt(0), 1, [new Address('0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E')]),
      expectedValue: '7db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b500000007000000003b9aca0000000000000000000000000100000001888888cf1046e68e36e1aa2e0e07105eddd1f08e'
    },
    {
      description: 'Amount min, locktime élevé, threshold min',
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      output: new Secp256k1Output(BigInt(1), BigInt(1000000000), 1, [new Address('0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E')]),
      expectedValue: '7db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b5000000070000000000000001000000003b9aca000000000100000001888888cf1046e68e36e1aa2e0e07105eddd1f08e'
    },
    {
      description: 'Amount min, locktime min, threshold élevé',
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      output: new Secp256k1Output(BigInt(1), BigInt(0), 1000, [new Address('0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E')]),
      expectedValue: '7db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b50000000700000000000000010000000000000000000003e800000001999999cf1046e68e36e1aa2e0e07105eddd1f08e'
    },
    {
      description: 'Multiple addresses',
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      output: new Secp256k1Output(BigInt(100), BigInt(0), 2, [new Address('0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E'), new Address('0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E')]),
      expectedValue: '7db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b500000007000000000000006400000000000000000000000200000002888888cf1046e68e36e1aa2e0e07105eddd1f08e999999cf1046e68e36e1aa2e0e07105eddd1f08e'
    },
    {
      description: 'Zero amount, zero locktime, zero threshold',
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      output: new Secp256k1Output(BigInt(0), BigInt(0), 0, [new Address('0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E')]),
      expectedValue: '7db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b500000007000000000000000000000000000000000000000000000001888888cf1046e68e36e1aa2e0e07105eddd1f08e'
    },
    {
      description: 'Maximum possible values',
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      output: new Secp256k1Output(BigInt('18446744073709551615'), BigInt('18446744073709551615'), 4294967295, [new Address('0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E')]),
      expectedValue: '7db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b500000007ffffffffffffffffffffffffffffffffffffffff00000001888888cf1046e68e36e1aa2e0e07105eddd1f08e'
    },
    {
      description: 'Random values',
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      output: new Secp256k1Output(BigInt(12345), BigInt(67890), 111, [new Address('0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E')]),
      expectedValue: '7db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b500000007000000000000303900000000000109320000006f00000001888888cf1046e68e36e1aa2e0e07105eddd1f08e'
    },
    {
      description: 'Same value for amount, locktime, and threshold',
      assetId: new AssetId('xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM'),
      output: new Secp256k1Output(BigInt(999), BigInt(999), 999, [new Address('0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E')]),
      expectedValue: '7db94035fa4902aee2c4c1e600d4e4d9cd9121ca57d23e98eeab45bdf88de8b50000000700000000000003e700000000000003e7000003e700000001888888cf1046e68e36e1aa2e0e07105eddd1f08e'
    }
  ])('$description',
    ({ assetId, output, expectedValue }) => {
      const transferableOutput = new TransferableOutput(assetId, output)
      const serialized = transferableOutput.serialize()
      expect(serialized).toBeInstanceOf(JuneoBuffer)
      expect(serialized.toHex()).toBe(expectedValue)
    })
})
describe('Secp256k1Output', () => {
  test.each([
    {
      description: 'should serialize correctly for amount 100 and address 0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E',
      amount: BigInt(100),
      locktime: BigInt(0),
      threshold: 1,
      addresses: [new Address('0xc0ffee254729296a45a3885639AC7E10F9d54979')],
      expectedValue: '00000007000000000000006400000000000000000000000100000001c0ffee254729296a45a3885639ac7e10f9d54979'
    },
    {
      description: 'should serialize correctly for amount 0',
      amount: BigInt(200),
      locktime: BigInt(10),
      threshold: 2,
      addresses: [
        new Address('0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E'),
        new Address('0x888888cf1046e68e36E1aA2E0E07105eDDD1f08E')
      ],
      expectedValue: '0000000700000000000000c8000000000000000a0000000200000002888888cf1046e68e36e1aa2e0e07105eddd1f08e999999cf1046e68e36e1aa2e0e07105eddd1f08e'
    },
    {
      description: 'Amount 300, locktime 20, threshold 3',
      amount: BigInt(300),
      locktime: BigInt(20),
      threshold: 3,
      addresses: [
        new Address('0x777777cf1046e68e36E1aA2E0E07105eDDD1f08E'),
        new Address('0x666666cf1046e68e36E1aA2E0E07105eDDD1f08E'),
        new Address('0x555555cf1046e68e36E1aA2E0E07105eDDD1f08E')
      ],
      expectedValue: '00000007000000000000012c00000000000000140000000300000003555555cf1046e68e36e1aa2e0e07105eddd1f08e666666cf1046e68e36e1aa2e0e07105eddd1f08e777777cf1046e68e36e1aa2e0e07105eddd1f08e'
    },
    {
      description: 'Amount 1, locktime 0, threshold 1',
      amount: BigInt(1),
      locktime: BigInt(0),
      threshold: 1,
      addresses: [new Address('0x1111111111111111111111111111111111111111')],
      expectedValue: '000000070000000000000001000000000000000000000001000000011111111111111111111111111111111111111111'
    },
    {
      description: 'Smallest possible threshold',
      amount: BigInt(100),
      locktime: BigInt(0),
      threshold: 1,
      addresses: [new Address('0x1111111111111111111111111111111111111111')],
      expectedValue: '000000070000000000000064000000000000000000000001000000011111111111111111111111111111111111111111'
    },
    {
      description: 'Zero locktime',
      amount: BigInt(100),
      locktime: BigInt(0),
      threshold: 1,
      addresses: [new Address('0x1111111111111111111111111111111111111111')],
      expectedValue: '000000070000000000000064000000000000000000000001000000011111111111111111111111111111111111111111'
    },
    {
      description: 'Large threshold',
      amount: BigInt(100),
      locktime: BigInt(0),
      threshold: 1000,
      addresses: [new Address('0x1111111111111111111111111111111111111111')],
      expectedValue: '0000000700000000000000640000000000000000000003e8000000011111111111111111111111111111111111111111'
    },
    {
      description: 'Multiple addresses with the same value',
      amount: BigInt(100),
      locktime: BigInt(0),
      threshold: 2,
      addresses: [
        new Address('0x1111111111111111111111111111111111111111'),
        new Address('0x1111111111111111111111111111111111111111')
      ],
      expectedValue: '0000000700000000000000640000000000000000000000020000000211111111111111111111111111111111111111111111111111111111111111111111111111111111'
    },
    {
      description: 'Threshold greater than number of addresses',
      amount: BigInt(100),
      locktime: BigInt(0),
      threshold: 3,
      addresses: [
        new Address('0x1111111111111111111111111111111111111111'),
        new Address('0x2222222222222222222222222222222222222222')
      ],
      expectedValue: '0000000700000000000000640000000000000000000000030000000211111111111111111111111111111111111111112222222222222222222222222222222222222222'
    },
    {
      description: 'Addresses in random order',
      amount: BigInt(100),
      locktime: BigInt(0),
      threshold: 2,
      addresses: [
        new Address('0x2222222222222222222222222222222222222222'),
        new Address('0x1111111111111111111111111111111111111111')
      ],
      expectedValue: '0000000700000000000000640000000000000000000000020000000211111111111111111111111111111111111111112222222222222222222222222222222222222222'
    }

  ])('$description',
    ({ amount, locktime, threshold, addresses, expectedValue }) => {
      const output = new Secp256k1Output(amount, locktime, threshold, addresses)
      const serialized = output.serialize()
      expect(serialized).toBeInstanceOf(JuneoBuffer)
      expect(serialized.toHex()).toBe(expectedValue)
    })

  test.each([
    {
      amount: BigInt('1000000000000000000000'),
      locktime: BigInt('1000000000000000000000'),
      threshold: 1000,
      addresses: [new Address('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')]
    },
    {
      amount: BigInt('1000000000000000000000'),
      locktime: BigInt(0),
      threshold: 1,
      addresses: [new Address('0x1111111111111111111111111111111111111111')]
    },
    {
      amount: BigInt(100),
      locktime: BigInt('1000000000000000000000'),
      threshold: 1,
      addresses: [new Address('0x1111111111111111111111111111111111111111')]
    }

  ])('should not serialize for amount $amount, locktime $locktime, threshold $threshold, and addresses',
    ({ amount, locktime, threshold, addresses }) => {
      expect(() => {
        const output = new Secp256k1Output(amount, locktime, threshold, addresses)
        output.serialize()
      }).toThrow()
    })
})
