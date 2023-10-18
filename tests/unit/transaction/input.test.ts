import { JuneoBuffer, Secp256k1Input } from '../../../src'
describe('Secp256k1Input', () => {
  test.each([
    { amount: BigInt(100), addressIndices: [1, 2], expectedValue: '000000050000000000000064000000020000000100000002' },
    { amount: BigInt(200), addressIndices: [2, 3], expectedValue: '0000000500000000000000c8000000020000000200000003' }
  ])('should serialize correctly for amount $amount and addressIndices $addressIndices',
    ({ amount, addressIndices, expectedValue }) => {
      const input = new Secp256k1Input(amount, addressIndices)
      const serialized = input.serialize()
      expect(serialized).toBeInstanceOf(JuneoBuffer)
      expect(serialized.toHex()).toBe(expectedValue)
    })
})
