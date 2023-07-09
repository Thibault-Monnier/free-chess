import { Board } from '../board'
import { Piece } from './piece'

describe('possibleMoves', () => {
    it('skips castlings in skipVerification mode', () => {
        const board = new Board()
        board.importFEN('4k2r/8/8/8/8/8/8/4K2R b Kk - 0 0')

        const kingSquareNb = 60
        const king = board.squares[kingSquareNb]!
        expect(king).toEqual(expect.objectContaining({ name: 'king', color: 'black' }))

        // If castlings were not skipped from opponent (= white) moves computation, our implementation of
        // castlings would result in a "Maximum call stack size exceeded" error.
        expect(() => king.possibleMoves(kingSquareNb, board, {})).not.toThrowError()
    })
})
