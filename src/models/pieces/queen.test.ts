import { Board } from '../board'
import { OpponentAttackTable } from '../types'

describe('updateAttackTable', () => {
    describe('test with specific fen', () => {
        const board = new Board('k7/n7/8/8/8/8/Q7/K7 w - - 0 0')
        const queenSquareNb = 8
        const queen = board.squares[queenSquareNb]

        expect(queen?.name).toBe('queen')

        const table: OpponentAttackTable = { attackedSquares: new Array(64).fill(false), pinnedPieces: [] }
        queen?.updateAttackTable(queenSquareNb, board, table)

        it('calculates squares attacked by queen', () => {
            expect(table.attackedSquares.filter((square) => square === true).length).toBe(20)
        })

        it('calculates pieces pinned by queen', () => {
            expect(table.pinnedPieces).toEqual([
                {
                    squareNb: 48,
                    offset: { file: 0, rank: 1 },
                },
            ])
        })
    })
})