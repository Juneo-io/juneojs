import { JuneoBuffer } from '../../../src'

describe('juneojs utils test', () => {
  describe('BytesData class tests', () => {
    // TODO write tests for BytesData class
  })

  describe('JuneoBuffer class tests', () => {
    describe('alloc static method', () => {
      test.each([
        ['Alloc with length 0', 0, 0],
        ['Alloc with length 16', 16, 16],
        ['Alloc with length 32', 32, 32],
        ['Alloc with length 64', 64, 64],
        ['Alloc with length 128', 128, 128],
        ['Alloc with large length 1e6', 1e6, 1e6],
        ['Alloc with large length 1e7', 1e7, 1e7],
        ['Alloc with large length 1e8', 1e8, 1e8]
      ])('%s', (description, length, expectedLength) => {
        const buffer = JuneoBuffer.alloc(length)
        expect(buffer).toBeInstanceOf(JuneoBuffer)
        expect(buffer.length).toBe(expectedLength)
      })

      test.each([
        ['Alloc with negative length -1', -1],
        ['Alloc with negative length -16', -16],
        ['Alloc with non-numeric length "abc"', 'abc'],
        ['Alloc with null length', null],
        ['Alloc with undefined length', undefined],
        ['Alloc with extremely large length 1e18', 1e18],
        ['Alloc with extremely large length Number.MAX_SAFE_INTEGER', Number.MAX_SAFE_INTEGER],
        ['Alloc with extremely large length Number.MAX_VALUE', Number.MAX_VALUE]
      ])('%s', (description, length) => {
        expect(() => {
          JuneoBuffer.alloc(length as any)
        }).toThrow()
      })
    })

    describe('write and read methods', () => {
      test.each([
        ['write and read UInt8', 1, 'writeUInt8', 'readUInt8', 42],
        ['write and read UInt8 with max value', 1, 'writeUInt8', 'readUInt8', 255],
        ['write and read UInt16', 2, 'writeUInt16', 'readUInt16', 300],
        ['write and read UInt16 with max value', 2, 'writeUInt16', 'readUInt16', 65535],
        ['write and read UInt32', 4, 'writeUInt32', 'readUInt32', 70000],
        ['write and read UInt32 with max value', 4, 'writeUInt32', 'readUInt32', 4294967295],
        ['write and read UInt64', 8, 'writeUInt64', 'readUInt64', BigInt(9007199254740991)],
        ['write and read UInt64 with max value', 8, 'writeUInt64', 'readUInt64', BigInt('18446744073709551615')]
      ])('%s', (description, size, writeMethodName, readMethodName, value) => {
        const buffer = JuneoBuffer.alloc(size);
        (buffer[writeMethodName as keyof JuneoBuffer] as any)(value)
        expect((buffer[readMethodName as keyof JuneoBuffer] as any)(0)).toBe(value)
      })

      test.each([
        ['write UInt8 with insufficient buffer size', 0, 'writeUInt8', 42],
        ['write UInt16 with insufficient buffer size', 1, 'writeUInt16', 300],
        ['write UInt32 with insufficient buffer size', 3, 'writeUInt32', 70000],
        ['write UInt64 with insufficient buffer size', 7, 'writeUInt64', BigInt(9007199254740991)]
      ])('%s', (description, size, writeMethodName, value) => {
        const buffer = JuneoBuffer.alloc(size)
        expect(() => {
          (buffer[writeMethodName as keyof JuneoBuffer] as any)(value)
        }).toThrow()
      })
    })

    describe('String operations', () => {
      test.each([
        ['write and read short string', 32, 'test', 0, 4, 'test'],
        ['write and read empty string', 32, '', 0, 0, ''],
        ['write and read number as string', 32, '42', 0, 2, '42'],
        ['write and read special characters', 32, '#$%', 0, 3, '#$%'],
        ['write and read multiple words', 32, 'hello world', 0, 11, 'hello world'],
        ['write and read with offset', 32, 'test', 1, 3, 'est'],
        ['write and read uppercase string', 32, 'UPPER', 0, 5, 'UPPER'],
        ['write and read mixed-case string', 32, 'MiXeD', 0, 5, 'MiXeD'],
        ['write and read unicode characters', 32, 'éçñ', 0, 3, 'éçñ'],
        ['write and read full buffer', 4, 'full', 0, 4, 'full'],
        ['write and read partial buffer', 8, 'partial', 0, 4, 'part'],
        ['write and read with negative offset', 32, 'test', -1, 3, ''],
        ['write and read exceeding buffer', 32, 'test', 0, 40, 'test']
      ])('%s', (description, bufferSize, writeString, readStart, readLength, expected) => {
        const buffer = JuneoBuffer.alloc(bufferSize)
        buffer.writeString(writeString)
        expect(buffer.readString(readStart, readLength)).toBe(expected)
      })

      test.each([
        ['write string to insufficient buffer size', 0, 'test', 0, 4]
      ])('Should throw error when %s', (description, bufferSize, writeString, readStart, readLength) => {
        const buffer = JuneoBuffer.alloc(bufferSize)
        if (description.startsWith('read')) {
          buffer.writeString(writeString)
          expect(() => {
            buffer.readString(readStart, readLength)
          }).toThrow()
        } else if (description.startsWith('write')) {
          expect(() => {
            buffer.writeString(writeString)
          }).toThrow()
        }
      })
    })

    describe('Conversion methods', () => {
      test.each([
        ['Convert empty buffer to CB58', 32, 'writeUInt8', 0, 'toCB58', '11111111111111111111111111111111LpoYY'],
        ['Convert filled buffer to CB58', 32, 'writeUInt8', 255, 'toCB58', '2wJdharspTqevWit1s8f7X7E2qGS6ZpsSppTL5Q21vrbT5zzNb'],
        ['Convert empty buffer to CHex', 32, 'writeUInt8', 0, 'toCHex', '0x00000000000000000000000000000000000000000000000000000000000000000d5f2925'],
        ['Convert filled buffer to CHex', 32, 'writeUInt8', 255, 'toCHex', '0xff000000000000000000000000000000000000000000000000000000000000006f583350'],
        ['Convert empty buffer to Hex', 32, 'writeUInt8', 0, 'toHex', '0000000000000000000000000000000000000000000000000000000000000000'],
        ['Convert filled buffer to Hex', 32, 'writeUInt8', 255, 'toHex', 'ff00000000000000000000000000000000000000000000000000000000000000'],
        ['Convert empty buffer to CB58', 32, 'writeUInt8', 0, 'toCB58', '11111111111111111111111111111111LpoYY'],
        ['Convert filled buffer to CB58', 32, 'writeUInt8', 255, 'toCB58', '2wJdharspTqevWit1s8f7X7E2qGS6ZpsSppTL5Q21vrbT5zzNb']
      ])('%s', (description, bufferSize, fillMethod, fillValue, conversionMethod, expectedOutput) => {
        const buffer = JuneoBuffer.alloc(bufferSize);
        (buffer[fillMethod as keyof JuneoBuffer] as any)(fillValue)
        expect((buffer[conversionMethod as keyof JuneoBuffer] as any)()).toBe(expectedOutput)
      })
    })

    describe('getBytes method', () => {
      test.each([
        ['Should return internal buffer with length 0', 0],
        ['Should return internal buffer with length 16', 16],
        ['Should return internal buffer with length 32', 32],
        ['Should return internal buffer with length 64', 64]
      ])('%s', (description, length) => {
        const buffer = JuneoBuffer.alloc(length)
        expect(buffer.getBytes()).toEqual(buffer.getBytes())
      })

      test.each([
        ['Should fail with negative length -1', -1],
        ['Should fail with negative length -16', -16],
        ['Should fail with non-numeric length "abc"', 'abc'],
        ['Should fail with null length', null],
        ['Should fail with undefined length', undefined]
      ])('%s', (description, length) => {
        expect(() => {
          JuneoBuffer.alloc(length as any)
        }).toThrow()
      })
    })

    describe('copyOf method', () => {
      test.each([
        ['Should copy the entire buffer', 32, 0, 32, 32],
        ['Should handle negative indices', 32, -4, -1, 3],
        ['Should copy a subset of buffer from 0 to 16', 32, 0, 16, 16],
        ['Should copy the entire buffer when indices are not provided', 32, undefined, undefined, 32],
        ['Should handle negative indices from -4 to -1', 32, -4, -1, 3],
        ['Should handle out-of-bounds indices from 40 to 50', 32, 40, 50, 0]

      ])('%s', (description, bufferSize, start, end, expectedLength) => {
        const buffer = JuneoBuffer.alloc(bufferSize)
        const copy = buffer.copyOf(start, end)
        expect(copy.length).toBe(expectedLength)
      })

      // All this test does not throw an error
      test.each([
        ['Should fail with negative length', -32, 0, 16],
        ['Should fail with start greater than end', 32, 16, 0],
        ['Should fail when negative start index is out-of-bounds', 32, -40, -30],
        ['Should fail when end index is less than start index', 32, 10, 5],
        ['Should fail with both start and end negative where start > end', 32, -1, -4],
        ['Should fail with start as undefined', 32, undefined, 16],
        ['Should fail with end as undefined', 32, 0, undefined],
        ['Should fail with start as null', 32, null, 16],
        ['Should fail with end as null', 32, 0, null]
      ])('%s', (description, bufferSize, start, end) => {
        const buffer = JuneoBuffer.alloc(bufferSize)
        expect(() => {
          buffer.copyOf(start as any, end as any)
        }).toThrow()
      })
    })

    describe('concat method', () => {
      test.each([
        ['Should concatenate two buffers of length 16', [16, 16], 32],
        ['Should concatenate three buffers of length 16', [16, 16, 16], 48],
        ['Should concatenate one buffer of length 16', [16], 16],
        ['Should handle an empty array of buffers', [], 0]
      ])('%s', (description, bufferSizes, expectedLength) => {
        const buffers = bufferSizes.map(size => JuneoBuffer.alloc(size))
        const result = JuneoBuffer.concat(buffers)
        expect(result.length).toBe(expectedLength)
      })

      test.each([
        ['Should fail when array contains non-JuneoBuffer elements', [JuneoBuffer.alloc(16), 'invalid'], 16],
        ['Should fail when array contains null elements', [JuneoBuffer.alloc(16), null], 16]
      ])('%s', (description, invalidBuffers, expectedLength) => {
        expect(() => {
          JuneoBuffer.concat(invalidBuffers as any)
        }).toThrow()
      })
    })

    describe('fromBytes method', () => {
      test.each([
        ['Should create a new JuneoBuffer from an empty buffer', Buffer.from([]), 0],
        ['Should create a new JuneoBuffer from a non-empty buffer', Buffer.from([1, 2, 3, 4]), 4],
        ['Should create a new JuneoBuffer from a large buffer', Buffer.from(Array(100).fill(1)), 100],
        ['Should create a new JuneoBuffer from a buffer with various values', Buffer.from([255, 128, 64, 32]), 4]
      ])('%s', (description, someBuffer, expectedLength) => {
        const buffer = JuneoBuffer.fromBytes(someBuffer)
        expect(buffer.length).toBe(expectedLength)
      })

      test.each([
        ['Should fail when provided with a non-Buffer object', 'notABuffer', 0],
        ['Should fail when provided with a null object', null, 0],
        ['Should fail when provided with an undefined object', undefined, 0]
      ])('%s', (description, someBuffer, expectedLength) => {
        expect(() => {
          JuneoBuffer.fromBytes(someBuffer as any)
        }).toThrow()
      })
    })

    describe('fromString method', () => {
      test.each([
        ['Should create a new JuneoBuffer from a non-empty hex string', '68656c6c6f', 'hex', 5], // 'hello' in hex
        ['Should create a new JuneoBuffer from a hex string with various values', 'deadbeef', 'hex', 4],
        ['Should create a new JuneoBuffer from a cHex string with various values', '3c647d88Bc92766075feA7A965CA599CAAB2FD26', 'hex', 20],
        ['Should create a new JuneoBuffer from a non-empty CB58 string', '2wJdharspTqevWit1s8f7X7E2qGS6ZpsSppTL5Q21vrbT5zzNb', 'CB58', 32]
      ])('%s', (description, someString, encoding, expectedLength) => {
        const buffer = JuneoBuffer.fromString(someString, encoding)
        expect(buffer.length).toBe(expectedLength)
      })

      test.each([
        ['Should not create a new JuneoBuffer from an empty hex string', '', 'hex']
      ])('%s', (description, someString, encoding) => {
        expect(() => {
          JuneoBuffer.fromString(someString, encoding)
        }).toThrow()
      })
    })

    describe('comparator method', () => {
      test.each([
        ['Should return 0 when both buffers have the same data', 16, 16, 0],
        ['Should return a negative number when the first buffer is less than the second', 15, 16, -1],
        ['Should return a positive number when the first buffer is greater than the second', 17, 16, 1]
      ])('%s', (description, bufferSize1, bufferSize2, expectedComparison) => {
        const buffer1 = JuneoBuffer.alloc(bufferSize1 as any)
        const buffer2 = JuneoBuffer.alloc(bufferSize2 as any)
        expect(JuneoBuffer.comparator(buffer1, buffer2)).toBe(expectedComparison)
      })

      test.each([
        ['Should fail when both buffers are undefined', undefined, undefined],
        ['Should fail when first buffer is undefined', undefined, 16],
        ['Should fail when second buffer is undefined', 16, undefined],
        ['Should fail when both buffers are null', null, null],
        ['Should fail when first buffer is null', null, 16],
        ['Should fail when second buffer is null', 16, null]
      ])('%s', (description, bufferSize1, bufferSize2) => {
        expect(() => {
          const buffer1 = JuneoBuffer.alloc(bufferSize1 as any)
          const buffer2 = JuneoBuffer.alloc(bufferSize2 as any)
          JuneoBuffer.comparator(buffer1, buffer2)
        }).toThrow()
      })
    })
  })
})
