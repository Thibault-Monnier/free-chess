import { Board } from '../board'
import { OpponentAttackTable } from '../types'

describe('updateAttackTable', () => {
    const board = new Board()
    board.importFEN('7k/n7/5q2/8/3B4/8/5P2/8 w - - 0 0')

    const bishopSquareNb = 27

    const bishop = board.squares[bishopSquareNb]
    expect(bishop?.name).toBe('bishop')

    const table: OpponentAttackTable = { attackedSquares: new Array(64).fill(false), pinnedPieces: [] }
    bishop?.updateAttackTable(bishopSquareNb, board, table)

    it('calculates attacked squares', () => {
        expect(table.attackedSquares.filter((square) => square === true).length).toBe(10)
    })
    
    it('calculates pinned pieces', () => {
        expect(table.pinnedPieces).toEqual([
            {
                squareNb: 45,
                offset: { file: 1, rank: 1 },
            },
        ])
    })
})
