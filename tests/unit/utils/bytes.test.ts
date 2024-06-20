import { JuneoBuffer } from '../../../src'

describe('Bytes', () => {
  test.todo('BytesData')

  describe('JuneoBuffer', () => {
    describe('Allocate', () => {
      test.each([
        { size: 0, expectedLength: 0 },
        { size: 16, expectedLength: 16 },
        { size: 32, expectedLength: 32 },
        { size: 64, expectedLength: 64 },
        { size: 128, expectedLength: 128 },
        { size: 1e6, expectedLength: 1e6 }
      ])('Size of $size', ({ size, expectedLength }) => {
        const buffer = JuneoBuffer.alloc(size)
        expect(buffer).toBeInstanceOf(JuneoBuffer)
        expect(buffer.length).toBe(expectedLength)
      })

      test.failing.each([
        { description: 'Negative', size: -1 },
        { description: 'Negative', size: -16 },
        { description: 'Non-numeric', size: 'abc' },
        { description: 'Null', size: null },
        { description: 'Undefined', size: undefined },
        { description: 'Extremely large', size: 1e18 }
      ])('$description size of $size', ({ size }) => {
        JuneoBuffer.alloc(size as any)
      })
    })

    describe('Write and read', () => {
      test.each([
        {
          description: 'Regular value',
          size: 1,
          writeMethodName: 'writeUInt8',
          readMethodName: 'readUInt8',
          value: 42
        },
        {
          description: 'Max value',
          size: 1,
          writeMethodName: 'writeUInt8',
          readMethodName: 'readUInt8',
          value: 255
        },
        {
          description: 'Regular value',
          size: 2,
          writeMethodName: 'writeUInt16',
          readMethodName: 'readUInt16',
          value: 300
        },
        {
          description: 'Max value',
          size: 2,
          writeMethodName: 'writeUInt16',
          readMethodName: 'readUInt16',
          value: 65535
        },
        {
          description: 'Regular value',
          size: 4,
          writeMethodName: 'writeUInt32',
          readMethodName: 'readUInt32',
          value: 70000
        },
        {
          description: 'Max value',
          size: 4,
          writeMethodName: 'writeUInt32',
          readMethodName: 'readUInt32',
          value: 4294967295
        },
        {
          description: 'Regular value',
          size: 8,
          writeMethodName: 'writeUInt64',
          readMethodName: 'readUInt64',
          value: BigInt('9007199254740991')
        },
        {
          description: 'Max value',
          size: 8,
          writeMethodName: 'writeUInt64',
          readMethodName: 'readUInt64',
          value: BigInt('18446744073709551615')
        }
      ])(
        '$description: $writeMethodName (size of $size) value of $value and $readMethodName',
        ({ size, writeMethodName, readMethodName, value }) => {
          const buffer = JuneoBuffer.alloc(size)
          ;(buffer[writeMethodName as keyof JuneoBuffer] as any)(value)
          expect((buffer[readMethodName as keyof JuneoBuffer] as any)(0)).toBe(value)
        }
      )

      test.failing.each([
        {
          size: 0,
          writeMethodName: 'writeUInt8',
          value: 42
        },
        {
          size: 1,
          writeMethodName: 'writeUInt16',
          value: 300
        },
        {
          size: 3,
          writeMethodName: 'writeUInt32',
          value: 70000
        },
        {
          size: 7,
          writeMethodName: 'writeUInt64',
          value: BigInt('9007199254740991')
        }
      ])(
        'Insufficient buffer size: $writeMethodName (size of $size) value of $value',
        ({ size, writeMethodName, value }) => {
          const buffer = JuneoBuffer.alloc(size)
          ;(buffer[writeMethodName as keyof JuneoBuffer] as any)(value)
        }
      )
    })

    describe('Strings', () => {
      test.each([
        {
          description: 'Short string',
          bufferSize: 32,
          writeString: 'test',
          readStart: 0,
          readLength: 4,
          expected: 'test'
        },
        {
          description: 'Number as string',
          bufferSize: 32,
          writeString: '42',
          readStart: 0,
          readLength: 2,
          expected: '42'
        },
        {
          description: 'Special characters',
          bufferSize: 32,
          writeString: '#$%',
          readStart: 0,
          readLength: 3,
          expected: '#$%'
        },
        {
          description: 'Multiple words',
          bufferSize: 32,
          writeString: 'hello world',
          readStart: 0,
          readLength: 11,
          expected: 'hello world'
        },
        {
          description: 'With offset',
          bufferSize: 32,
          writeString: 'test',
          readStart: 1,
          readLength: 3,
          expected: 'est'
        },
        {
          description: 'Uppercase string',
          bufferSize: 32,
          writeString: 'UPPER',
          readStart: 0,
          readLength: 5,
          expected: 'UPPER'
        },
        {
          description: 'Mixed-case string',
          bufferSize: 32,
          writeString: 'MiXeD',
          readStart: 0,
          readLength: 5,
          expected: 'MiXeD'
        },
        // temporarily commented until unicode issue is fixed
        // {
        //   description: 'Unicode characters',
        //   bufferSize: 32,
        //   writeString: 'éçñ',
        //   readStart: 0,
        //   readLength: 3,
        //   expected: 'éçñ'
        // },
        {
          description: 'Full buffer',
          bufferSize: 4,
          writeString: 'full',
          readStart: 0,
          readLength: 4,
          expected: 'full'
        },
        {
          description: 'Partial buffer',
          bufferSize: 8,
          writeString: 'partial',
          readStart: 0,
          readLength: 4,
          expected: 'part'
        }
      ])(
        '$description "$writeString" (size of $bufferSize)',
        ({ bufferSize, writeString, readStart, readLength, expected }) => {
          const buffer = JuneoBuffer.alloc(bufferSize)
          buffer.writeString(writeString)
          expect(buffer.readString(readStart, readLength)).toBe(expected)
        }
      )

      test.failing.each([
        {
          description: 'Empty string',
          size: 32,
          value: '',
          readStart: 0,
          readLength: 0,
          expected: ''
        },
        {
          description: 'With negative offset',
          size: 32,
          value: 'test',
          readStart: -1,
          readLength: 3,
          expected: ''
        },
        {
          description: 'Exceeding buffer',
          size: 32,
          value: 'test',
          readStart: 0,
          readLength: 40,
          expected: 'test'
        }
      ])(
        '$description: read length of $readLength at index $readStart',
        ({ size, value, readStart, readLength, expected }) => {
          const buffer = JuneoBuffer.alloc(size)
          buffer.writeString(value)
          expect(buffer.readString(readStart, readLength)).toBe(expected)
        }
      )

      test.failing.each([{ description: 'Insufficient buffer size', size: 0, writeString: 'test' }])(
        '$description: write value of $writeString in size of $size ',
        ({ size, writeString }) => {
          const buffer = JuneoBuffer.alloc(size)
          buffer.writeString(writeString)
        }
      )
    })

    describe('Encodings', () => {
      test.each([
        {
          description: 'Empty buffer',
          size: 32,
          fillMethod: 'writeUInt8',
          value: 0,
          conversionMethod: 'toCB58',
          expectedOutput: '11111111111111111111111111111111LpoYY'
        },
        {
          description: 'Filled buffer',
          size: 32,
          fillMethod: 'writeUInt8',
          value: 255,
          conversionMethod: 'toCB58',
          expectedOutput: '2wJdharspTqevWit1s8f7X7E2qGS6ZpsSppTL5Q21vrbT5zzNb'
        },
        {
          description: 'Empty buffer',
          size: 32,
          fillMethod: 'writeUInt8',
          value: 0,
          conversionMethod: 'toCHex',
          expectedOutput: '0x00000000000000000000000000000000000000000000000000000000000000000d5f2925'
        },
        {
          description: 'Filled buffer',
          size: 32,
          fillMethod: 'writeUInt8',
          value: 255,
          conversionMethod: 'toCHex',
          expectedOutput: '0xff000000000000000000000000000000000000000000000000000000000000006f583350'
        },
        {
          description: 'Empty buffer',
          size: 32,
          fillMethod: 'writeUInt8',
          value: 0,
          conversionMethod: 'toHex',
          expectedOutput: '0000000000000000000000000000000000000000000000000000000000000000'
        },
        {
          description: 'Filled buffer',
          size: 32,
          fillMethod: 'writeUInt8',
          value: 255,
          conversionMethod: 'toHex',
          expectedOutput: 'ff00000000000000000000000000000000000000000000000000000000000000'
        }
      ])(
        '$description (size of $size) $fillMethod value of $value conversion $conversionMethod',
        ({ size, fillMethod, value, conversionMethod, expectedOutput }) => {
          const buffer = JuneoBuffer.alloc(size)
          ;(buffer[fillMethod as keyof JuneoBuffer] as any)(value)
          expect((buffer[conversionMethod as keyof JuneoBuffer] as any)()).toBe(expectedOutput)
        }
      )
    })

    describe('getBytes', () => {
      test.each([
        { description: 'Zero size', size: 0, data: undefined },
        { description: 'Written full', size: 8, data: BigInt(1) },
        { description: 'Written half', size: 16, data: BigInt(1) },
        { description: 'Empty', size: 8, data: undefined }
      ])('$description: value $data in size of $size', ({ size, data }) => {
        const buffer = JuneoBuffer.alloc(size)
        if (data !== undefined) {
          buffer.writeUInt64(data)
        }
        expect(buffer.getBytes()).toEqual(buffer.getBytes())
      })
    })

    describe('copyOf', () => {
      test.each([
        {
          description: 'Copy the entire buffer',
          size: 32,
          start: 0,
          end: 32,
          expectedLength: 32
        },
        {
          description: 'Copy a subset of buffer',
          size: 32,
          start: 0,
          end: 16,
          expectedLength: 16
        },
        {
          description: 'Copy one byte',
          size: 32,
          start: 0,
          end: 1,
          expectedLength: 1
        },
        {
          description: 'Copy the entire buffer when indices are not provided',
          size: 32,
          start: undefined,
          end: undefined,
          expectedLength: 32
        },
        {
          description: 'Start as undefined',
          size: 32,
          start: undefined,
          end: 32,
          expectedLength: 32
        },
        {
          description: 'End as undefined',
          size: 32,
          start: 0,
          end: undefined,
          expectedLength: 32
        }
      ])('$description: size of $size from index $start to $end', ({ size, start, end, expectedLength }) => {
        const buffer = JuneoBuffer.alloc(size)
        const copy = buffer.copyOf(start as any, end as any)
        expect(copy.length).toBe(expectedLength)
      })

      test.failing.each([
        {
          description: 'Negative size',
          size: -32,
          start: 0,
          end: 16
        },
        {
          description: 'Negative indices',
          size: 32,
          start: -4,
          end: -1
        },
        {
          description: 'Out-of-bounds indices',
          size: 32,
          start: 40,
          end: 50
        },
        {
          description: 'Start greater than end',
          size: 32,
          start: 16,
          end: 0
        },
        {
          description: 'Negative indices and start greater than end',
          size: 32,
          start: -1,
          end: -4
        },
        {
          description: 'Start as null',
          size: 32,
          start: null,
          end: 16
        },
        {
          description: 'End as null',
          size: 32,
          start: 0,
          end: null
        }
      ])('$description: size of $size from index $start to $end', ({ size, start, end }) => {
        const buffer = JuneoBuffer.alloc(size)
        buffer.copyOf(start as any, end as any)
      })
    })

    describe('concat', () => {
      test.each([
        { sizes: [16, 16], expectedLength: 32 },
        { sizes: [16, 16, 16], expectedLength: 48 },
        { sizes: [16], expectedLength: 16 },
        { sizes: [], expectedLength: 0 }
      ])('Concatenating $sizes.length buffers', ({ sizes, expectedLength }) => {
        const buffers = sizes.map((size) => JuneoBuffer.alloc(size))
        const result = JuneoBuffer.concat(buffers)
        expect(result.length).toBe(expectedLength)
      })

      test.failing.each([
        { description: 'Contains non-JuneoBuffer elements', invalidBuffers: [JuneoBuffer.alloc(16), 'INVALID'] },
        { description: 'Contains null elements', invalidBuffers: [JuneoBuffer.alloc(16), null] }
      ])('$description', ({ invalidBuffers }) => {
        JuneoBuffer.concat(invalidBuffers as any)
      })
    })

    describe('fromBytes', () => {
      test.each([
        { description: 'Empty buffer', someBuffer: Buffer.from([]), expectedLength: 0 },
        { description: 'Non-empty buffer', someBuffer: Buffer.from([1, 2, 3, 4]), expectedLength: 4 },
        { description: 'Large buffer', someBuffer: Buffer.from(Array(100).fill(1)), expectedLength: 100 },
        { description: 'Various values', someBuffer: Buffer.from([255, 128, 64, 32]), expectedLength: 4 }
      ])('$description', ({ someBuffer, expectedLength }) => {
        const buffer = JuneoBuffer.fromBytes(someBuffer)
        expect(buffer.length).toBe(expectedLength)
      })

      test.failing.each([
        { description: 'Non-Buffer object', someBuffer: 'NOT_A_BUFFER' },
        { description: 'Null object', someBuffer: null },
        { description: 'Undefined object', someBuffer: undefined }
      ])('$description', (someBuffer) => {
        JuneoBuffer.fromBytes(someBuffer as any)
      })
    })

    describe('fromString', () => {
      test.each([
        {
          description: 'Non-empty hex string',
          someString: '68656c6c6f', // hello in hex
          encoding: 'hex',
          expectedLength: 5
        },
        {
          description: 'Hex string with various values',
          someString: 'deadbeef',
          encoding: 'hex',
          expectedLength: 4
        },
        {
          description: 'CHex string with various values',
          someString: '3c647d88Bc92766075feA7A965CA599CAAB2FD26',
          encoding: 'hex',
          expectedLength: 20
        },
        {
          description: 'Non-empty CB58 string',
          someString: '2wJdharspTqevWit1s8f7X7E2qGS6ZpsSppTL5Q21vrbT5zzNb',
          encoding: 'CB58',
          expectedLength: 32
        }
      ])('$description', ({ someString, encoding, expectedLength }) => {
        const buffer = JuneoBuffer.fromString(someString, encoding)
        expect(buffer.length).toBe(expectedLength)
      })

      test.failing.each([
        {
          description: 'Empty hex string',
          someString: '',
          encoding: 'hex'
        }
      ])('$description', ({ someString, encoding }) => {
        JuneoBuffer.fromString(someString, encoding)
      })
    })

    describe('comparator', () => {
      test.each([
        {
          description: 'Same data',
          bufferSize1: 16,
          bufferSize2: 16,
          expectedComparison: 0
        },
        {
          description: 'First is less than second',
          bufferSize1: 15,
          bufferSize2: 16,
          expectedComparison: -1
        },
        {
          description: 'First is greater than second',
          bufferSize1: 17,
          bufferSize2: 16,
          expectedComparison: 1
        }
      ])('$description', ({ bufferSize1, bufferSize2, expectedComparison }) => {
        const buffer1 = JuneoBuffer.alloc(bufferSize1 as any)
        const buffer2 = JuneoBuffer.alloc(bufferSize2 as any)
        expect(JuneoBuffer.comparator(buffer1, buffer2)).toBe(expectedComparison)
      })

      test.failing.each([
        {
          description: 'Buffers are undefined',
          bufferSize1: undefined,
          bufferSize2: undefined
        },
        {
          description: 'First buffer is undefined',
          bufferSize1: undefined,
          bufferSize2: 16
        },
        {
          description: 'Second buffer is undefined',
          bufferSize1: 16,
          bufferSize2: undefined
        },
        {
          description: 'Buffers are null',
          bufferSize1: null,
          bufferSize2: null
        },
        {
          description: 'First buffer is null',
          bufferSize1: null,
          bufferSize2: 16
        },
        {
          description: 'Second buffer is null',
          bufferSize1: 16,
          bufferSize2: null
        }
      ])('$description', ({ bufferSize1, bufferSize2 }) => {
        const buffer1 = JuneoBuffer.alloc(bufferSize1 as any)
        const buffer2 = JuneoBuffer.alloc(bufferSize2 as any)
        JuneoBuffer.comparator(buffer1, buffer2)
      })
    })
  })
})
