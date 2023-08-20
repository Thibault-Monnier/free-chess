import { Board } from "../board"
import { OpponentAttackTable } from "../types"

describe('updateAttackTable', () => {
    describe('test with specific fen', () => {
        const board = new Board('k7/8/8/8/1P6/8/8/K7 w - - 0 0')
        const pawnSquareNb = 25
        const pawn = board.squares[pawnSquareNb]

        expect(pawn?.name).toBe('pawn')

        const table: OpponentAttackTable = { attackedSquares: new Array(64).fill(false), pinnedPieces: [] }
        pawn?.updateAttackTable(pawnSquareNb, board, table)

        it('calculates attacked squares', () => {
            expect(table.attackedSquares.filter((square) => square === true).length).toBe(2)
        })
    })
})