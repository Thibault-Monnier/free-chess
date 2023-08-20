import { Board } from "../board"
import { OpponentAttackTable } from "../types"

describe('updateAttackTable', () => {
    describe('test with specific fen', () => {
        const board = new Board('k7/8/8/8/8/8/8/K1N5 w - - 0 0')
        const knightSquareNb = 2
        const knight = board.squares[knightSquareNb]

        expect(knight?.name).toBe('knight')

        const table: OpponentAttackTable = { attackedSquares: new Array(64).fill(false), pinnedPieces: [] }
        knight?.updateAttackTable(knightSquareNb, board, table)

        it('calculates attacked squares', () => {
            expect(table.attackedSquares.filter((square) => square === true).length).toBe(4)
        })
    })
})