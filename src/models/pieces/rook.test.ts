import { Board } from '../Board'
import { AttackTable } from '../types'
import { createEmptyAttackTable } from '../utils'

describe('updateAttackTable', () => {
    describe('test with specific FEN', () => {
        const board = new Board('kb5R/8/8/8/8/8/8/K7 w - - 0 0')
        const rookSquareNb = 63
        const rook = board.squares[rookSquareNb]

        expect(rook?.name).toBe('rook')

        const table: AttackTable = createEmptyAttackTable()
        rook?.updateAttackTable(rookSquareNb, board, table)

        it('calculates squares attacked by rook', () => {
            expect(table.attackedSquares.filter((square) => square === true).length).toBe(13)
        })

        it('calculates pieces pinned by rook', () => {
            expect(table.pinnedPieces).toEqual([
                {
                    squareNb: 57,
                    offset: { file: -1, rank: 0 },
                },
            ])
        })
    })
})
