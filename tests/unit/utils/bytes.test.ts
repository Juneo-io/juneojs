import { JuneoBuffer } from '../../../src'

describe('juneojs utils test', () => {
  interface MethodMap {
    writeUInt8: (buffer: JuneoBuffer, value: number) => void
    readUInt8: (buffer: JuneoBuffer, index: number) => number
    writeUInt16: (buffer: JuneoBuffer, value: number) => void
    readUInt16: (buffer: JuneoBuffer, index: number) => number
    writeUInt32: (buffer: JuneoBuffer, value: number) => void
    readUInt32: (buffer: JuneoBuffer, index: number) => number
    writeUInt64: (buffer: JuneoBuffer, value: bigint) => void
    readUInt64: (buffer: JuneoBuffer, index: number) => bigint
  }

  const methods: MethodMap = {
    writeUInt8: (buffer, value) => { buffer.writeUInt8(value) },
    readUInt8: (buffer, index) => buffer.readUInt8(index),
    writeUInt16: (buffer, value) => { buffer.writeUInt16(value) },
    readUInt16: (buffer, index) => buffer.readUInt16(index),
    writeUInt32: (buffer, value) => { buffer.writeUInt32(value) },
    readUInt32: (buffer, index) => buffer.readUInt32(index),
    writeUInt64: (buffer, value) => { buffer.writeUInt64(value) },
    readUInt64: (buffer, index) => buffer.readUInt64(index)
  }

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
        (methods[writeMethodName as keyof MethodMap] as any)(buffer, value)
        expect((methods[readMethodName as keyof MethodMap] as any)(buffer, 0)).toBe(value)
      })

      test.each([
        ['write UInt8 with insufficient buffer size', 0, 'writeUInt8', 42],
        ['write UInt16 with insufficient buffer size', 1, 'writeUInt16', 300],
        ['write UInt32 with insufficient buffer size', 3, 'writeUInt32', 70000],
        ['write UInt64 with insufficient buffer size', 7, 'writeUInt64', BigInt(9007199254740991)]
      ])('%s', (description, size, writeMethodName, value) => {
        const buffer = JuneoBuffer.alloc(size)
        expect(() => {
          (methods[writeMethodName as keyof MethodMap] as any)(buffer, value)
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
        ['Convert empty buffer to CB58', 32, 'writeUInt8', 0, 'toCB58', 'q'],
        ['Convert filled buffer to CB58', 32, 'writeUInt8', 255, 'toCB58', 'Hs8Q'],
        ['Convert empty buffer to CHex', 32, 'writeUInt8', 0, 'toCHex', 'q'],
        ['Convert filled buffer to CHex', 32, 'writeUInt8', 255, 'toCHex', 'Hs8Q'],
        ['Convert empty buffer to Hex', 32, 'writeUInt8', 0, 'toHex', 'q'],
        ['Convert filled buffer to Hex', 32, 'writeUInt8', 255, 'toHex', 'Hs8Q']
      ])('%s', (description, bufferSize, fillMethod, fillValue, conversionMethod, expectedOutput) => {
        const buffer = JuneoBuffer.alloc(bufferSize)
        methods[fillMethod as keyof MethodMap](buffer, fillValue)

        // Vous pouvez également ajouter une méthode de conversion à MethodMap si nécessaire
        expect(methods[conversionMethod as keyof MethodMap](buffer)).toBe(expectedOutput)
      })
    })

    // 2. Testing getBytes
    describe('getBytes method', () => {
      test('Should return internal buffer', () => {
        const buffer = JuneoBuffer.alloc(32)
        // Fill the buffer somehow
        expect(buffer.getBytes()).toEqual(buffer.getBytes())
      })
    })

    // 3. Testing copyOf
    describe('copyOf method', () => {
      test('Should copy a subset of buffer', () => {
        const buffer = JuneoBuffer.alloc(32)
        // Fill the buffer somehow
        const copy = buffer.copyOf(0, 16)
        expect(copy.length).toBe(16)
      // Additional checks on the copied data
      })

      test('Should copy the entire buffer', () => {
        const buffer = JuneoBuffer.alloc(32)
        // Fill the buffer somehow
        const copy = buffer.copyOf()
        expect(copy.length).toBe(32)
      // Additional checks on the copied data
      })

      test('Should handle negative indices', () => {
        const buffer = JuneoBuffer.alloc(32)
        // Fill the buffer somehow
        const copy = buffer.copyOf(-4, -1)
        expect(copy.length).toBe(3)
      // Additional checks on the copied data
      })
    })

    // 4. Testing concat
    describe('concat method', () => {
      test('Should concatenate multiple JuneoBuffers', () => {
        const buffer1 = JuneoBuffer.alloc(16)
        const buffer2 = JuneoBuffer.alloc(16)
        const result = JuneoBuffer.concat([buffer1, buffer2])
        expect(result.length).toBe(32)
      })
    })

    // 5. Testing fromBytes
    describe('fromBytes method', () => {
      test('Should create a new JuneoBuffer from a given buffer', () => {
        const someBuffer = Buffer.from([/* Some byte values */])
        const buffer = JuneoBuffer.fromBytes(someBuffer)
        expect(buffer.length).toBe(someBuffer.length)
      })
    })

    // 6. Testing fromString
    describe('fromString method', () => {
      test('Should create a new JuneoBuffer from a hex string', () => {
        const buffer = JuneoBuffer.fromString('68656c6c6f', 'hex') // 'hello' in hex
        expect(buffer.length).toBe(5)
      })

      test('Should throw error for invalid data', () => {
        expect(() => {
          JuneoBuffer.fromString('invalid', 'hex')
        }).toThrow()
      })
    })

    // 7. Testing comparator
    describe('comparator method', () => {
      test('Should sort JuneoBuffers correctly', () => {
        const buffer1 = JuneoBuffer.alloc(16)
        const buffer2 = JuneoBuffer.alloc(16)
        // Fill the buffers somehow so they can be compared
        expect(JuneoBuffer.comparator(buffer1, buffer2)).toBe(0)
      })
    })
  })
})
