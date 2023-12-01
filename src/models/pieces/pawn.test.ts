import { Board } from "../board"
import { AttackTable } from "../types"
import { createEmptyAttackTable } from "../utils"

describe('updateAttackTable', () => {
    describe('test with specific FEN', () => {
        const board = new Board('k7/8/8/8/1P6/8/8/K7 w - - 0 0')
        const pawnSquareNb = 25
        const pawn = board.squares[pawnSquareNb]

        expect(pawn?.name).toBe('pawn')

        const table: AttackTable = createEmptyAttackTable()
        pawn?.updateAttackTable(pawnSquareNb, board, table)

        it('calculates attacked squares', () => {
            expect(table.attackedSquares.filter((square) => square === true).length).toBe(2)
        })
    })
})