import { Board } from '../board'
import { Move } from '../move'
import { AttackTable, PieceColor, PossibleMoveOptions, FileRank } from '../types'
import { Piece } from './piece'

export class Bishop extends Piece {
    constructor(color: PieceColor) {
        super('bishop', color)
    }

    possibleMoves(
        startSquareNb: number,
        board: Board,
        opponentAttackTable: AttackTable,
        options: PossibleMoveOptions
    ): Move[] {
        return this.createMovesForRepeatedOffsets(startSquareNb, OFFSETS, board, 'B', options)
    }

    updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void {
        this.calculateAttackTable(startSquareNb, board, table, OFFSETS, true)
    }
}

const OFFSETS: FileRank[] = [
    { file: 1, rank: 1 },
    { file: 1, rank: -1 },
    { file: -1, rank: 1 },
    { file: -1, rank: -1 },
]
