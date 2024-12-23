import { Board } from '../Board'
import { AttackTable } from '../types'
import { createEmptyAttackTable } from '../utils'

describe('possibleMoves', () => {
    it('skips castlings in skipVerification mode', () => {
        const board = new Board()
        board.importFEN('4k2r/8/8/8/8/8/8/4K2R b Kk - 0 0')

        const kingSquareNb = 60
        const king = board.squares[kingSquareNb]!
        expect(king).toEqual(expect.objectContaining({ name: 'king', color: 'black' }))

        // If castlings were not skipped from opponent (= white) moves computation, our implementation of
        // castlings would result in a "Maximum call stack size exceeded" error.
        expect(() => king.possibleMoves(kingSquareNb, board, createEmptyAttackTable())).not.toThrowError()
    })
})

describe('updateAttackTable', () => {
    describe('test with specific FEN', () => {
        const board = new Board('k7/8/8/8/8/8/8/K7 w - - 0 0')
        const kingSquareNb = 0
        const king = board.squares[kingSquareNb]

        expect(king?.name).toBe('king')

        const table: AttackTable = createEmptyAttackTable()
        king?.updateAttackTable(kingSquareNb, board, table)

        it('calculates attacked squares', () => {
            expect(table.attackedSquares.filter((square) => square === true).length).toBe(3)
        })
    })
})
