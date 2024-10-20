import { Board } from '../Board'
import { Move } from '../Move'
import { AttackTable, PieceColor, PieceLetter } from '../types'
import { Piece } from './Piece'

export class Queen extends Piece {
    constructor(color: PieceColor) {
        super('queen', color)
    }

    possibleMoves(startSquareNb: number, board: Board, opponentAttackTable: AttackTable): Move[] {
        return this.createMovesForRepeatedOffsets(startSquareNb, OFFSETS, board, opponentAttackTable)
    }

    updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void {
        this.calculateAttackTable(startSquareNb, board, table, OFFSETS, true)
    }

    get isSliding(): boolean {
        return true
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
