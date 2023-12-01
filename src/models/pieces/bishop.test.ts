import { Board } from '../board'
import { AttackTable } from '../types'
import { createEmptyAttackTable } from '../utils'

describe('updateAttackTable', () => {
    describe('test with specific FEN', () => {
        const board = new Board('7k/n7/5q2/8/3B4/8/5P2/8 w - - 0 0')
        const bishopSquareNb = 27
        const bishop = board.squares[bishopSquareNb]

        expect(bishop?.name).toBe('bishop')

        const table: AttackTable = createEmptyAttackTable()
        bishop?.updateAttackTable(bishopSquareNb, board, table)

        it('calculates squares attacked by bishop', () => {
            expect(table.attackedSquares.filter((square) => square === true).length).toBe(10)
        })

        it('calculates pieces pinned by bishop', () => {
            expect(table.pinnedPieces).toEqual([
                {
                    squareNb: 45,
                    offset: { file: 1, rank: 1 },
                },
            ])
        })
    })
})
