import {
  Address,
  AssetId,
  BLSPublicKey,
  BLSSignature,
  BlockchainId,
  DecodingError,
  DynamicId,
  JuneoTypeError,
  NodeId,
  TransactionId
} from '../../../src'

describe('Types', () => {
  describe('Address', () => {
    describe('Constructor', () => {
      test.each([
        { address: '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649' },
        { address: '0xb52db2d7ec7731d386c4bbb83c6a11194c0c6d94' }
      ])('Instantiate address: $address', ({ address }) => {
        const addrInstance = new Address(address)
        expect(addrInstance).toBeInstanceOf(Address)
      })

      test.each([
        {
          description: 'Invalid address size',
          address: '0x7afbc3a061a707ceb9b4d34be525f7b0d3d645',
          expectedError: JuneoTypeError
        },
        {
          description: 'Null address',
          address: null,
          expectedError: JuneoTypeError
        },
        {
          description: 'Undefined address',
          address: undefined,
          expectedError: JuneoTypeError
        },
        {
          description: 'Empty string',
          address: '',
          expectedError: DecodingError
        },
        {
          description: 'Just below limit',
          address: '0x7afbc3a061a707ceb9b4d34be525f7b0d3d',
          expectedError: JuneoTypeError
        },
        {
          description: 'Just above limit',
          address: '0x7afbc3a061a707ceb9b4d34be525f7b0d3d649a',
          expectedError: JuneoTypeError
        }
      ])('$description: $address', ({ address, expectedError }) => {
        expect(() => new Address(address as any)).toThrow(expectedError)
      })
    })

    describe('serialization', () => {
      test.each([
        { address: '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', result: '7afbc3a061a707cef0b9b4d34be525f7b0d3d649' },
        { address: '0xb52db2d7ec7731d386c4bbb83c6a11194c0c6d94', result: 'b52db2d7ec7731d386c4bbb83c6a11194c0c6d94' }
      ])('Serialize: $address', ({ address, result }) => {
        const addrInstance = new Address(address).serialize().toHex()
        expect(addrInstance).toBe(result)
      })
    })

    describe('matches', () => {
      test.each([
        {
          description: 'Same hexadecimal address',
          address1: '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649',
          address2: '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649'
        },
        {
          description: 'Address object',
          address1: '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649',
          address2: new Address('0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649')
        }
      ])('$description', ({ address1, address2 }) => {
        const addrInstance = new Address(address1)
        expect(addrInstance.matches(address2)).toBe(true)
      })

      test.failing.each([
        {
          description: 'Mismatched addresses',
          address1: '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649',
          address2: '0x8afbc3a061a707cef0b9b4d34be525f7b0d3d650'
        }
      ])('$description', ({ address1, address2 }) => {
        const addrInstance = new Address(address1)
        expect(addrInstance.matches(address2)).toBe(true)
      })

      describe('Invalid arguments', () => {
        test.each([
          {
            description: 'Null address',
            address1: '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649',
            address2: null,
            expectedError: JuneoTypeError
          },
          {
            description: 'Undefined address',
            address1: '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649',
            address2: undefined,
            expectedError: JuneoTypeError
          },
          {
            description: 'Invalid address',
            address1: '0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649',
            address2: '0x7afbc61a707cef0b9b4d34be525f7b0d3d649',
            expectedError: JuneoTypeError
          }
        ])('$description', ({ address1, address2, expectedError }) => {
          const addrInstance = new Address(address1)
          expect(() => addrInstance.matches(address2 as any)).toThrow(expectedError)
        })
      })
    })

    describe('toAddresses', () => {
      test.each([
        {
          description: 'Array of hexadecimal addresses',
          addressArray: ['0x7afbc3a061a707cef0b9b4d34be525f7b0d3d649', '0x8afbc3a061a707cef0b9b4d34be525f7b0d3d650'],
          expectedLength: 2
        }
      ])('$description', ({ addressArray, expectedLength }) => {
        const addrArray = Address.toAddresses(addressArray)
        expect(addrArray.length).toBe(expectedLength)
        addrArray.forEach((addr) => {
          expect(addr).toBeInstanceOf(Address)
        })
      })

      describe('Invalid arguments', () => {
        test.each([
          {
            description: 'Array with invalid address size',
            addressArray: ['0x7afbc3a061a7cef0b9b4d34be525f7b0d3d645'],
            expectedError: JuneoTypeError
          },
          {
            description: 'Array with null address',
            addressArray: [null],
            expectedError: JuneoTypeError
          },
          {
            description: 'Array with undefined address',
            addressArray: [undefined],
            expectedError: JuneoTypeError
          },
          {
            description: 'Empty array',
            addressArray: [],
            expectedError: JuneoTypeError
          }
        ])('$description', ({ addressArray, expectedError }) => {
          expect(() => Address.toAddresses(addressArray as any)).toThrow(expectedError)
        })
      })
    })
  })

  describe('AssetId', () => {
    describe('Constructor', () => {
      test.each([
        { assetId: '2sC7LPyJguMWdJztKGUa35ABj7KRh1WSNQThLWhdxhJJwGdhv2' },
        { assetId: 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbK' }
      ])('Instantiate assetId: $assetId', ({ assetId }) => {
        const assetInstance = new AssetId(assetId)
        expect(assetInstance).toBeInstanceOf(AssetId)
      })

      test.each([
        {
          description: 'Invalid size',
          assetId: 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXb',
          expectedError: DecodingError
        },
        {
          description: 'Invalid checksum',
          assetId: 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbz',
          expectedError: DecodingError
        },
        {
          description: 'Null AssetId',
          assetId: null,
          expectedError: JuneoTypeError
        },
        {
          description: 'Undefined AssetId',
          assetId: undefined,
          expectedError: JuneoTypeError
        },
        {
          description: 'Empty string',
          assetId: '',
          expectedError: DecodingError
        }
      ])('$description', ({ assetId, expectedError }) => {
        expect(() => new AssetId(assetId as any)).toThrow(expectedError)
      })
    })

    describe('serialization', () => {
      test.each([
        {
          assetId: '2sC7LPyJguMWdJztKGUa35ABj7KRh1WSNQThLWhdxhJJwGdhv2',
          result: '2sC7LPyJguMWdJztKGUa35ABj7KRh1WSNQThLWhdxhJJwGdhv2'
        },
        {
          assetId: 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbK',
          result: 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbK'
        }
      ])('Serialize: $assetId', ({ assetId, result }) => {
        const assetInstance = new AssetId(assetId).serialize().toCB58()
        expect(assetInstance).toBe(result)
      })
    })

    describe('validate', () => {
      test.each([
        {
          assetId: '2sC7LPyJguMWdJztKGUa35ABj7KRh1WSNQThLWhdxhJJwGdhv2'
        },
        {
          assetId: 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbK'
        }
      ])('Validating $assetId', ({ assetId }) => {
        expect(AssetId.validate(assetId)).toBe(true)
      })

      test.failing.each([
        {
          description: 'Empty string',
          assetId: ''
        }
      ])('$description', ({ assetId }) => {
        expect(AssetId.validate(assetId)).toBe(true)
      })

      test.each([
        {
          description: 'Invalid AssetId',
          assetId: 'G3mH67ubqNAJB6txHTHFtFzH56ynk6RjT9iBzXbz',
          expected: DecodingError
        },
        {
          description: 'Null AssetId',
          assetId: null,
          expected: JuneoTypeError
        },
        {
          description: 'Undefined AssetId',
          assetId: undefined,
          expected: JuneoTypeError
        }
      ])('$description', ({ assetId, expected }) => {
        expect(() => AssetId.validate(assetId as any)).toThrow(expected)
      })
    })
  })

  describe('TransactionId', () => {
    describe('Constructor', () => {
      test.each([
        { transactionId: '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92Eq' },
        { transactionId: '2FKNX3WoJwtbanNxVV44qaXsv8SgkiBtD4psHC2wdbLizXvGS' }
      ])('Instantiate transactionId $transactionId', ({ transactionId }) => {
        expect(new TransactionId(transactionId)).toBeInstanceOf(TransactionId)
      })

      test.each([
        {
          description: 'Invalid size',
          transactionId: '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92E',
          expectedError: DecodingError
        },
        {
          description: 'Invalid size',
          transactionId: '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92Eqq',
          expectedError: DecodingError
        },
        {
          description: 'Null TransactionId',
          transactionId: null,
          expectedError: JuneoTypeError
        },
        {
          description: 'Undefined TransactionId',
          transactionId: undefined,
          expectedError: JuneoTypeError
        },
        {
          description: 'Empty string',
          transactionId: '',
          expectedError: DecodingError
        },
        {
          description: 'Special characters',
          transactionId: '2pSSuo2ui@#ViPQT96GowYPK5wJBk',
          expectedError: DecodingError
        },
        {
          description: 'Upper case',
          transactionId: '2PSSUO2UIVIPQT96GOWYPK5WJBKDDD7GQXAXK3KZN9YZHI92EQ',
          expectedError: DecodingError
        },
        {
          description: 'Lower bound size',
          transactionId: '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92E',
          expectedError: DecodingError
        },
        {
          description: 'Upper bound size',
          transactionId: '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92Eqa',
          expectedError: DecodingError
        }
      ])('$description', ({ transactionId, expectedError }) => {
        expect(() => new TransactionId(transactionId as any)).toThrow(expectedError)
      })
    })
  })

  describe('serialization', () => {
    test.each([
      {
        transactionId: '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92Eq',
        result: '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92Eq'
      },
      {
        transactionId: '2FKNX3WoJwtbanNxVV44qaXsv8SgkiBtD4psHC2wdbLizXvGS',
        result: '2FKNX3WoJwtbanNxVV44qaXsv8SgkiBtD4psHC2wdbLizXvGS'
      }
    ])('Serialize: $transactionId', ({ transactionId, result }) => {
      expect(new TransactionId(transactionId).serialize().toCB58()).toBe(result)
    })
  })

  describe('BlockchainId', () => {
    describe('Constructor', () => {
      test.each([
        { blockchainId: '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o' },
        { blockchainId: 'fqxdvHoxBciiVa7wAZjq48HYmFVyQefrDpPyVuPd5GAUHAjEN' },
        { blockchainId: 'NLp7mU4yqN9xfu3Yezc6Sq66xFx5E1bKaxsBZRBZ7N7FmKhb5' }
      ])('Instantiate blockchainId: $blockchainId', ({ blockchainId }) => {
        expect(new BlockchainId(blockchainId)).toBeInstanceOf(BlockchainId)
      })

      test.each([
        {
          description: 'Invalid size',
          blockchainId: '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8u',
          expectedError: DecodingError
        },
        {
          description: 'Invalid size',
          blockchainId: '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2oq',
          expectedError: DecodingError
        },
        {
          description: 'Null BlockchainId',
          blockchainId: null,
          expectedError: JuneoTypeError
        },
        {
          description: 'Undefined BlockchainId',
          blockchainId: undefined,
          expectedError: JuneoTypeError
        },
        {
          description: 'Empty string',
          blockchainId: '',
          expectedError: DecodingError
        },
        {
          description: 'Special characters',
          blockchainId: '2c2z3duV8XJ@#kZHedp19WTBtKEpk',
          expectedError: DecodingError
        },
        {
          description: 'Upper case',
          blockchainId: '2C2Z3DUV8XJHKZHEDP19WTBTK',
          expectedError: DecodingError
        },
        {
          description: 'Lower bound size',
          blockchainId: '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8u',
          expectedError: DecodingError
        },
        {
          description: 'Upper bound size',
          blockchainId: '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2oq',
          expectedError: DecodingError
        }
      ])('$description', ({ blockchainId, expectedError }) => {
        expect(() => new BlockchainId(blockchainId as any)).toThrow(expectedError)
      })

      describe('serialization', () => {
        test.each([
          {
            blockchainId: '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o',
            result: '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o'
          },
          {
            blockchainId: 'fqxdvHoxBciiVa7wAZjq48HYmFVyQefrDpPyVuPd5GAUHAjEN',
            result: 'fqxdvHoxBciiVa7wAZjq48HYmFVyQefrDpPyVuPd5GAUHAjEN'
          },
          {
            blockchainId: 'NLp7mU4yqN9xfu3Yezc6Sq66xFx5E1bKaxsBZRBZ7N7FmKhb5',
            result: 'NLp7mU4yqN9xfu3Yezc6Sq66xFx5E1bKaxsBZRBZ7N7FmKhb5'
          }
        ])('Serialize: $blockchainId', ({ blockchainId, result }) => {
          expect(new BlockchainId(blockchainId).serialize().toCB58()).toBe(result)
        })
      })
    })
  })

  describe('Signature', () => {
    test.todo('Constructor')
    // TODO: Add tests for Signature class
  })

  describe('NodeId', () => {
    describe('Constructor', () => {
      test.each([
        { nodeId: 'NodeID-3VELiL3Hp6uFjAoFZEJpjM7PvQebidBGM' },
        { nodeId: 'NodeID-6SBf3r6drpPgRyd5vmyKZgAKo7zXhHpEN' },
        { nodeId: '3VELiL3Hp6uFjAoFZEJpjM7PvQebidBGM' },
        { nodeId: '6SBf3r6drpPgRyd5vmyKZgAKo7zXhHpEN' }
      ])('Instantiate nodeId: $nodeId', ({ nodeId }) => {
        expect(new NodeId(nodeId)).toBeInstanceOf(NodeId)
      })

      test.each([
        {
          description: 'Invalid size',
          nodeId: 'NodeID-2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92E',
          expectedError: DecodingError
        },
        {
          description: 'Invalid size without prefix',
          nodeId: '2pSSuo2uiViPQT96GowYPK5wJBkddD7GqxaXK3kzn9YZHi92E',
          expectedError: DecodingError
        },
        {
          description: 'Null NodeId',
          nodeId: null,
          expectedError: JuneoTypeError
        },
        {
          description: 'Undefined NodeId',
          nodeId: undefined,
          expectedError: JuneoTypeError
        },
        {
          description: 'Empty string',
          nodeId: '',
          expectedError: DecodingError
        },
        {
          description: 'Special characters',
          nodeId: 'NodeID-2pSSuo2ui@#ViPQT96GowYPK5wJBk',
          expectedError: DecodingError
        },
        {
          description: 'Upper case',
          nodeId: 'NodeID-2PSSUO2UIVIPQT96GOWYPK5WJBKDDD7GQXAXK3KZN9YZHI92EQ',
          expectedError: DecodingError
        }
      ])('$description', ({ nodeId, expectedError }) => {
        expect(() => new NodeId(nodeId as any)).toThrow(expectedError)
      })
    })
  })

  describe('serialization', () => {
    test.each([
      { nodeId: 'NodeID-3VELiL3Hp6uFjAoFZEJpjM7PvQebidBGM', result: '3VELiL3Hp6uFjAoFZEJpjM7PvQebidBGM' },
      { nodeId: 'NodeID-6SBf3r6drpPgRyd5vmyKZgAKo7zXhHpEN', result: '6SBf3r6drpPgRyd5vmyKZgAKo7zXhHpEN' },
      { nodeId: '3VELiL3Hp6uFjAoFZEJpjM7PvQebidBGM', result: '3VELiL3Hp6uFjAoFZEJpjM7PvQebidBGM' },
      { nodeId: '6SBf3r6drpPgRyd5vmyKZgAKo7zXhHpEN', result: '6SBf3r6drpPgRyd5vmyKZgAKo7zXhHpEN' }
    ])('Serialize: $nodeId', ({ nodeId, result }) => {
      expect(new NodeId(nodeId).serialize().toCB58()).toBe(result)
    })
  })

  describe('DynamicId', () => {
    describe('Constructor', () => {
      test.each([
        { description: 'Short value', value: 'shortValue' },
        { description: 'Number value', value: '123456' },
        { description: 'Special characters', value: '!@#$%^&*()' },
        { description: 'Empty string', value: '' }
      ])('$description', ({ value }) => {
        expect(new DynamicId(value)).toBeInstanceOf(DynamicId)
      })

      test.each([
        {
          description: 'Too long value',
          value: 'ThisIsALongValueThatExceedsDynamicIdSize',
          expectedError: JuneoTypeError
        },
        { description: 'Null DynamicId', value: null, expectedError: JuneoTypeError },
        { description: 'Undefined DynamicId', value: undefined, expectedError: JuneoTypeError }
      ])('$description', ({ value, expectedError }) => {
        expect(() => new DynamicId(value as any)).toThrow(expectedError)
      })
    })

    describe('serialization', () => {
      test.each([
        {
          description: 'Short value',
          value: 'shortValue',
          result: '73686f727456616c756500000000000000000000000000000000000000000000'
        },
        {
          description: 'Number value',
          value: '123456',
          result: '3132333435360000000000000000000000000000000000000000000000000000'
        },
        {
          description: 'Special characters',
          value: '!@#$%^&*()',
          result: '21402324255e262a282900000000000000000000000000000000000000000000'
        },
        {
          description: 'Empty string',
          value: '',
          result: '0000000000000000000000000000000000000000000000000000000000000000'
        }
      ])('$description serialization', ({ value, result }) => {
        expect(new DynamicId(value).serialize().toHex()).toBe(result)
      })
    })
  })

  describe('BLSPublicKey', () => {
    describe('Constructor', () => {
      test.each([
        {
          description: 'Invalid size',
          publicKey: 'e330cdf5219b896d0a3383d3da8c7d23b0608cbc37ca77dee37bfbd0b379f3',
          expectedError: DecodingError
        },
        {
          description: 'Null BLSPublicKey',
          publicKey: null,
          expectedError: JuneoTypeError
        },
        {
          description: 'Undefined BLSPublicKey',
          publicKey: undefined,
          expectedError: JuneoTypeError
        },
        {
          description: 'Empty string',
          publicKey: '',
          expectedError: DecodingError
        },
        {
          description: 'Special characters',
          publicKey: 'e330cdf5219b896d0a3383d3da8c7d23b0608cbc37ca77dee37bfbd0b379f3!!',
          expectedError: DecodingError
        }
      ])('$description', ({ publicKey, expectedError }) => {
        expect(() => new BLSPublicKey(publicKey as any)).toThrow(expectedError)
      })
    })
  })

  describe('BLSSignature', () => {
    describe('Constructor', () => {
      test.each([
        {
          description: 'Invalid size',
          signature: 'e330cdf5219b896d0a3383d3da8c7d23b0608cbc37ca77dee37bfbd0b379f3',
          expectedError: DecodingError
        },
        {
          description: 'Null BLSSignature',
          signature: null,
          expectedError: JuneoTypeError
        },
        {
          description: 'Undefined BLSSignature',
          signature: undefined,
          expectedError: JuneoTypeError
        },
        {
          description: 'Empty string',
          signature: '',
          expectedError: DecodingError
        },
        {
          description: 'Special characters',
          signature: 'e330cdf5219b896d0a3383d3da8c7d23b0608cbc37ca77dee37bfbd0b379f3!!',
          expectedError: DecodingError
        }
      ])('$description', ({ signature, expectedError }) => {
        expect(() => new BLSSignature(signature as any)).toThrow(expectedError)
      })
    })
  })
})
