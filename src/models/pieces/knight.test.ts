import { Board } from '../Board'
import { AttackTable } from '../types'
import { createEmptyAttackTable } from '../utils'

describe('updateAttackTable', () => {
    describe('test with specific FEN', () => {
        const board = new Board('k7/8/8/8/8/8/8/K1N5 w - - 0 0')
        const knightSquareNb = 2
        const knight = board.squares[knightSquareNb]

        expect(knight?.name).toBe('knight')

        const table: AttackTable = createEmptyAttackTable()
        knight?.updateAttackTable(knightSquareNb, board, table)

        it('calculates attacked squares', () => {
            expect(table.attackedSquares.filter((square) => square === true).length).toBe(4)
        })
    })
})
