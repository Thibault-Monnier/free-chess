import { Board } from '../Board'
import { Move } from '../Move'
import { AttackTable, PieceColor, FileRank, PieceLetter } from '../types'
import { Piece } from './Piece'

export class Bishop extends Piece {
    constructor(color: PieceColor) {
        super('bishop', color)
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

const OFFSETS: FileRank[] = [
    { file: 1, rank: 1 },
    { file: 1, rank: -1 },
    { file: -1, rank: 1 },
    { file: -1, rank: -1 },
]
