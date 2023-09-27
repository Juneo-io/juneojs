import { JuneoBuffer } from '../../src'
import * as encoding from '../../src/utils/encoding'

describe('Encoding', (): void => {
    test('Verify checksum', (): void => {
        // TODO add verification of checksum of other encoding types
        // valid
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('123abcbcee49f6', 'hex'))).toBe(true)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('7a1b2c3d88ba9d4c', 'hex'))).toBe(true)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('fedcba98765432100fa7e28e', 'hex'))).toBe(true)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('123456789abcdef0668592d1', 'hex'))).toBe(true)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('abcdefd21609a7', 'hex'))).toBe(true)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('deadbeefaa813953', 'hex'))).toBe(true)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('017785459a', 'hex'))).toBe(true)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('0017afa01d', 'hex'))).toBe(true)
        // invalid
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('123abc', 'hex'))).toBe(false)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('7a1b2c3d', 'hex'))).toBe(false)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('fedcba9876543210', 'hex'))).toBe(false)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('123456789abcdef0', 'hex'))).toBe(false)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('abcdef', 'hex'))).toBe(false)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('deadbeef', 'hex'))).toBe(false)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('01', 'hex'))).toBe(false)
        expect(encoding.verifyChecksum(JuneoBuffer.fromString('00', 'hex'))).toBe(false)
    })
    test('Has hex prefix', (): void => {
        // valid
        expect(encoding.hasHexPrefix('0x')).toBe(true)
        expect(encoding.hasHexPrefix('0x0')).toBe(true)
        expect(encoding.hasHexPrefix('0xa')).toBe(true)
        expect(encoding.hasHexPrefix('0xz')).toBe(true)
        expect(encoding.hasHexPrefix('0xabc123')).toBe(true)
        // invalid
        expect(encoding.hasHexPrefix('00x')).toBe(false)
        expect(encoding.hasHexPrefix('0')).toBe(false)
        expect(encoding.hasHexPrefix('')).toBe(false)
        expect(encoding.hasHexPrefix('abc123')).toBe(false)
    })
    test('Is hex', (): void => {
        // valid
        expect(encoding.isHex('0x0')).toBe(true)
        expect(encoding.isHex('0x')).toBe(true)
        expect(encoding.isHex('0')).toBe(true)
        expect(encoding.isHex('0xabcdef0123456789')).toBe(true)
        expect(encoding.isHex('abcdef0123456789')).toBe(true)
        // invalid
        expect(encoding.isHex('00xabcdef0123456789')).toBe(false)
        expect(encoding.isHex('0xzabcdef0123456789')).toBe(false)
        expect(encoding.isHex('xabcdef0123456789')).toBe(false)
        expect(encoding.isHex('g')).toBe(false)
        expect(encoding.isHex('')).toBe(false)
    })
    test('Decode hex', (): void => {
        // valid
        expect(encoding.decodeHex('123abc').toHex()).toBe('123abc')
        expect(encoding.decodeHex('7a1b2c3d').toHex()).toBe('7a1b2c3d')
        expect(encoding.decodeHex('fedcba9876543210').toHex()).toBe('fedcba9876543210')
        expect(encoding.decodeHex('123456789abcdef0').toHex()).toBe('123456789abcdef0')
        expect(encoding.decodeHex('abcdef').toHex()).toBe('abcdef')
        expect(encoding.decodeHex('deadbeef').toHex()).toBe('deadbeef')
        expect(encoding.decodeHex('01').toHex()).toBe('01')
        expect(encoding.decodeHex('00').toHex()).toBe('00')
    })
    test('Encode checksum hex', (): void => {
        // valid
        expect(encoding.encodeCHex(JuneoBuffer.fromString('123abc', 'hex'))).toBe('0x123abcbcee49f6')
        expect(encoding.encodeCHex(JuneoBuffer.fromString('7a1b2c3d', 'hex'))).toBe('0x7a1b2c3d88ba9d4c')
        expect(encoding.encodeCHex(JuneoBuffer.fromString('fedcba9876543210', 'hex'))).toBe('0xfedcba98765432100fa7e28e')
        expect(encoding.encodeCHex(JuneoBuffer.fromString('123456789abcdef0', 'hex'))).toBe('0x123456789abcdef0668592d1')
        expect(encoding.encodeCHex(JuneoBuffer.fromString('abcdef', 'hex'))).toBe('0xabcdefd21609a7')
        expect(encoding.encodeCHex(JuneoBuffer.fromString('deadbeef', 'hex'))).toBe('0xdeadbeefaa813953')
        expect(encoding.encodeCHex(JuneoBuffer.fromString('01', 'hex'))).toBe('0x017785459a')
        expect(encoding.encodeCHex(JuneoBuffer.fromString('00', 'hex'))).toBe('0x0017afa01d')
    })
    test('Decode checksum hex', (): void => {
        // valid
        expect(encoding.decodeCHex('123abcbcee49f6').toHex()).toBe('123abc')
        expect(encoding.decodeCHex('7a1b2c3d88ba9d4c').toHex()).toBe('7a1b2c3d')
        expect(encoding.decodeCHex('fedcba98765432100fa7e28e').toHex()).toBe('fedcba9876543210')
        expect(encoding.decodeCHex('123456789abcdef0668592d1').toHex()).toBe('123456789abcdef0')
        expect(encoding.decodeCHex('abcdefd21609a7').toHex()).toBe('abcdef')
        expect(encoding.decodeCHex('deadbeefaa813953').toHex()).toBe('deadbeef')
        expect(encoding.decodeCHex('017785459a').toHex()).toBe('01')
        expect(encoding.decodeCHex('0017afa01d').toHex()).toBe('00')
    })
})
