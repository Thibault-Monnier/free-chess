import { isBetweenSquares } from './utils'

describe('isBetweenSquares', () => {
    it('verifies that the function returns the correct value', () => {
        expect(isBetweenSquares(0, 18, 27)).toBe(true)
    })
    it('', () => expect(isBetweenSquares(0, 8, 56)).toBe(true))
    it('', () => expect(isBetweenSquares(0, 8, 18)).toBe(false))
    it('', () => expect(isBetweenSquares(63, 61, 56)).toBe(true))
    it('', () => expect(isBetweenSquares(19, 19, 20)).toBe(false))
    it('', () => expect(isBetweenSquares(34, 38, 38)).toBe(false))
    it('', () => expect(isBetweenSquares(20, 19, 21)).toBe(false))
})
