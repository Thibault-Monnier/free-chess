import { Board } from '../board'
import { Move } from '../move'
import { AttackTable, PieceColor, PossibleMoveOptions } from '../types'
import { Piece } from './piece'

export class Queen extends Piece {
    constructor(color: PieceColor) {
        super('queen', color)
    }

    possibleMoves(
        startSquareNb: number,
        board: Board,
        opponentAttackTable: AttackTable,
        options: PossibleMoveOptions
    ): Move[] {
        return this.createMovesForRepeatedOffsets(startSquareNb, OFFSETS, board, 'Q', options)
    }

    updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void {
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
