import { Address, AssetId, DecodingError, TransactionId, TypeError } from '../../../src'

describe('juneojs type test', () => {
  describe('Address class tests', () => {
    describe('Constructor', () => {
      test.each([
        ['Valid argument (hex)', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649'],
        ['Valid argument (hex)', '0xb52db2d7ec7731d386c4bbb83c6a11194c0c6d94']
      ])('%s', (description, address) => {
        const addrInstance = new Address(address)
        expect(addrInstance).toBeInstanceOf(Address)
      })

      test.each([
        ['Invalid address size', '0x7afbc3a061a707ceb9b4d34be525f7b0d3d645', TypeError],
        // ['Null address', null, TypeError],
        // ['Undefined address', undefined, TypeError],
        ['Empty string', '', DecodingError]
      ])('%s', (description, address, expectedError) => {
        expect(() => new Address(address as any)).toThrow(expectedError)
      })
    })
    describe('matches method', () => {
      test.each([
        ['Matching with same hexadecimal address should return true', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', true],
        ['Mismatched addresses should return false', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', '0x8afbc3a061a707cef0b9b4d34be525f7b0d3d650', false]
      ])('%s', (description, address1, address2, expected) => {
        const addrInstance = new Address(address1)
        expect(addrInstance.matches(address2)).toBe(expected)
      })

      test.each([
        // ['Null address', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', null, TypeError],
        // ['Undefined address', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', undefined, TypeError]
      ])('%s', (description, address1, address2, expectedError) => {
        const addrInstance = new Address(address1)
        expect(() => addrInstance.matches(address2 as any)).toThrow(expectedError as any)
      })
    })

    describe('toAddresses static method', () => {
      test.each([
        ['Convert array of hexadecimal addresses', ['0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', '0x8afbc3a061a707cef0b9b4d34be525f7b0d3d650'], 2]
      ])('%s', (description, addressArray, expectedLength) => {
        const addrArray = Address.toAddresses(addressArray)
        expect(addrArray.length).toBe(expectedLength)
        addrArray.forEach(addr => {
          expect(addr).toBeInstanceOf(Address)
        })
      })

      // Invalid tests
      test.each([
        ['Array with invalid address size', ['0x7afbc3a061a7cef0b9b4d34be525f7b0d3d645'], TypeError],
        ['Array with null address', [null], TypeError],
        ['Array with undefined address', [undefined], TypeError],
        ['Empty array', [], TypeError]
      ])('%s', (description, addressArray, expectedErrorOrLength) => {
        expect(() => Address.toAddresses(addressArray as any)).toThrow(expectedErrorOrLength as any)
      })
    })
  })

  describe('AssetId class tests', () => {
    test('Should initialize AssetId instance with valid arguments', () => {
      const assetId = new AssetId('0x2d00000000000000000000000000000000000000')
      expect(assetId).toBeInstanceOf(AssetId)
    })

    test('Error with invalid assetId size', () => {
      expect(() => new AssetId('invalidSizeAssetId')).toThrow(DecodingError)
    })

  // Ajouter des tests pour la méthode `validate`, etc.
  })

  describe('TransactionId class tests', () => {
    test('Should initialize TransactionId instance with valid arguments', () => {
      const transactionId = new TransactionId('0x7e15d23aa425f8c0a6cb94e5d31d0258119721375444c1c0c26c8eb22f0b66f9')
      expect(transactionId).toBeInstanceOf(TransactionId)
    })

    test('Error with invalid transactionId size', () => {
      expect(() => new TransactionId('invalidSizeTransactionId')).toThrow(DecodingError)
    })

  // Ajouter d'autres tests si nécessaire
  })
})
