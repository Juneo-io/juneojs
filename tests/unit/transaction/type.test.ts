import { Address, AssetId, BlockchainId, DecodingError, JuneoTypeError, TransactionId } from '../../../src'

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
        ['Invalid address size', '0x7afbc3a061a707ceb9b4d34be525f7b0d3d645', JuneoTypeError],
        ['Null address', null, JuneoTypeError],
        ['Undefined address', undefined, JuneoTypeError],
        ['Empty string', '', DecodingError],
        ['Edge case: Just below limit', '0x7afbc3a061a707ceb9b4d34be525f7b0d3d', JuneoTypeError],
        ['Edge case: Just above limit', '0x7afbc3a061a707ceb9b4d34be525f7b0d3d649a', JuneoTypeError]
      ])('%s', (description, address, expectedError) => {
        expect(() => new Address(address as any)).toThrow(expectedError)
      })
    })
    describe('matches method', () => {
      test.each([
        ['Matching with same hexadecimal address should return true', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', true],
        ['Mismatched addresses should return false', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', '0x8afbc3a061a707cef0b9b4d34be525f7b0d3d650', false],
        ['Matching with Address object should return true', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', new Address('0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649'), true]

      ])('%s', (description, address1, address2, expected) => {
        const addrInstance = new Address(address1)
        expect(addrInstance.matches(address2)).toBe(expected)
      })

      describe('invalid arguments', () => {
        test.each([
          ['Null address', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', null, JuneoTypeError],
          ['Undefined address', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', undefined, JuneoTypeError],
          ['Matching with non-Address object should throw error', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', {}, TypeError],
          ['Matching with same hexadecimal address should return true', '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', '0x7afbc61a707cef0b9b4d34be525f7b0d3d649', JuneoTypeError]

        ])('%s', (description, address1, address2, expectedError) => {
          const addrInstance = new Address(address1)
          expect(() => addrInstance.matches(address2 as any)).toThrow(expectedError)
        })
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

      describe('invalid arguments', () => {
        test.each([
          ['Array with invalid address size', ['0x7afbc3a061a7cef0b9b4d34be525f7b0d3d645'], JuneoTypeError],
          ['Array with null address', [null], JuneoTypeError],
          ['Array with undefined address', [undefined], JuneoTypeError],
          ['Empty array', [], JuneoTypeError]
        ])('%s', (description, addressArray, expectedErrorOrLength) => {
          expect(() => Address.toAddresses(addressArray as any)).toThrow(expectedErrorOrLength as any)
        })
      })
    })
  })

  describe('AssetId class tests', () => {
    describe('Constructor', () => {
      test.each([
        ['Valid AssetId (example 1)', '2sC7LPyJguMWdJztKGUa35ABj7KRh1WSNQThLWhdxhJJwGdhv2'],
        ['Valid AssetId (example 2)', 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbK']
      ])('%s', (description, assetId) => {
        const assetInstance = new AssetId(assetId)
        expect(assetInstance).toBeInstanceOf(AssetId)
      })

      test.each([
        ['Invalid AssetId size', 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXb', DecodingError],
        ['Invalid AssetId size', 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbz', DecodingError],
        ['Null AssetId', null, DecodingError],
        ['Undefined AssetId', undefined, DecodingError],
        ['Empty string', '', DecodingError]
      ])('%s', (description, assetId, expectedError) => {
        expect(() => new AssetId(assetId as any)).toThrow(expectedError)
      })
    })

    describe('validate static method', () => {
      test.each([
        ['Valid Base58 AssetId should return true', '2sC7LPyJguMWdJztKGUa35ABj7KRh1WSNQThLWhdxhJJwGdhv2', true],
        ['Valid Base58 AssetId should return true', 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbK', true],
        ['Null AssetId should return false', null, false]
      ])('%s', (description, assetId, expected) => {
        expect(AssetId.validate(assetId as any)).toBe(expected)
      })

      test.each([
        ['Invalid AssetId should return false', 'G3mH67ubqNAJB6txHTHFtFzH56ynk6RjT9iBzXbz', DecodingError],
        ['Null AssetId should return false', null, DecodingError],
        ['Undefined AssetId should return false', undefined, DecodingError],
        ['Empty string should return false', '', DecodingError]
      ])('%s', (description, assetId, expected) => {
        expect(() => AssetId.validate(assetId as any)).toThrow(expected)
      })
    })
  })

  describe('TransactionId class tests', () => {
    describe('Constructor', () => {
      test.each([
        ['Valid Base58 TransactionId', '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92Eq'],
        ['Valid Base58 TransactionId', '2FKNX3WoJwtbanNxVV44qaXsv8SgkiBtD4psHC2wdbLizXvGS']
      ])('%s', (description, transactionId) => {
        expect(new TransactionId(transactionId)).toBeInstanceOf(TransactionId)
      })

      test.each([
        ['Invalid TransactionId size', '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92E', DecodingError],
        ['Invalid TransactionId size', '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92Eqq', DecodingError],
        ['Null TransactionId', null, DecodingError],
        ['Undefined TransactionId', undefined, DecodingError],
        ['Empty string', '', DecodingError],
        ['TransactionId with special characters', '2pSSuo2ui@#ViPQT96GowYPK5wJBk', DecodingError],
        ['TransactionId with upper case', '2PSSUO2UIVIPQT96GOWYPK5WJBKDDD7GQXAXK3KZN9YZHI92EQ', DecodingError],
        ['TransactionId with lower bound size', '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92E', DecodingError],
        ['TransactionId with upper bound size', '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92Eqa', DecodingError]
      ])('%s', (description, transactionId, expectedError) => {
        expect(() => new TransactionId(transactionId as any)).toThrow(expectedError)
      })
    })
  })

  describe('BlockchainId class tests', () => {
    describe('Constructor', () => {
      test.each([
        ['Valid Base58 BlockchainId', '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o'],
        ['Valid Base58 BlockchainId', 'fqxdvHoxBciiVa7wAZjq48HYmFVyQefrDpPyVuPd5GAUHAjEN'],
        ['Valid Base58 BlockchainId', 'NLp7mU4yqN9xfu3Yezc6Sq66xFx5E1bKaxsBZRBZ7N7FmKhb5']
      ])('%s', (description, blockchainId) => {
        expect(new BlockchainId(blockchainId)).toBeInstanceOf(BlockchainId)
      })

      test.each([
        ['Invalid BlockchainId size', '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8u', DecodingError],
        ['Invalid BlockchainId size', '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2oq', DecodingError],
        ['Null BlockchainId', null, DecodingError],
        ['Undefined BlockchainId', undefined, DecodingError],
        ['Empty string', '', DecodingError],
        ['BlockchainId with special characters', '2c2z3duV8XJ@#kZHedp19WTBtKEpk', DecodingError],
        ['BlockchainId with upper case', '2C2Z3DUV8XJHKZHEDP19WTBTK', DecodingError],
        ['BlockchainId with lower bound size', '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8u', DecodingError],
        ['BlockchainId with upper bound size', '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2oq', DecodingError]
      ])('%s', (description, blockchainId, expectedError) => {
        expect(() => new BlockchainId(blockchainId as any)).toThrow(expectedError)
      })
    })
  })
})
