import { Address, JuneoBuffer, Secp256k1Output } from '../../../src'
describe('Secp256k1Output', () => {
  test.each([
    {
      amount: BigInt(100),
      locktime: BigInt(0),
      threshold: 1,
      addresses: [new Address('0xc0ffee254729296a45a3885639AC7E10F9d54979')],
      expectedValue: '00000007000000000000006400000000000000000000000100000001c0ffee254729296a45a3885639ac7e10f9d54979'
    },
    {
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
      amount: BigInt(300),
      locktime: BigInt(20),
      threshold: 3,
      addresses: [
        new Address('0x777777cf1046e68e36E1aA2E0E07105eDDD1f08E'),
        new Address('0x666666cf1046e68e36E1aA2E0E07105eDDD1f08E'),
        new Address('0x555555cf1046e68e36E1aA2E0E07105eDDD1f08E')
      ],
      expectedValue: '00000007000000000000012c00000000000000140000000300000003555555cf1046e68e36e1aa2e0e07105eddd1f08e666666cf1046e68e36e1aa2e0e07105eddd1f08e777777cf1046e68e36e1aa2e0e07105eddd1f08e'
    }
  ])('should serialize correctly for amount $amount, locktime $locktime, threshold $threshold, and addresses',
    ({ amount, locktime, threshold, addresses, expectedValue }) => {
      const output = new Secp256k1Output(amount, locktime, threshold, addresses)
      const serialized = output.serialize()
      expect(serialized).toBeInstanceOf(JuneoBuffer)
      expect(serialized.toHex()).toBe(expectedValue)
    })
})
