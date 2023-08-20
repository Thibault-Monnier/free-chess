import { Board } from '../board'
import { Move } from '../move'
import { OpponentAttackTable, PieceColor, PossibleMoveOptions } from '../types'
import { Piece } from './piece'

export class Queen extends Piece {
    constructor(color: PieceColor) {
        super('queen', color)
    }

    possibleMoves(startSquareNb: number, board: Board, options: PossibleMoveOptions): Move[] {
        return this.createMovesForRepeatedOffsets(startSquareNb, OFFSETS, board, 'Q', options)
    }

    updateAttackTable(startSquareNb: number, board: Board, table: OpponentAttackTable): void {
        this.calculateAttackTable(startSquareNb, board, table, OFFSETS, true)
    }
}

const OFFSETS = [
    { file: 1, rank: 1 },
    { file: 1, rank: 0 },
    { file: 1, rank: -1 },
    { file: 0, rank: 1 },
    { file: 0, rank: -1 },
    { file: -1, rank: 1 },
    { file: -1, rank: 0 },
    { file: -1, rank: -1 },
]
