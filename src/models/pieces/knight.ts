import { Board } from '../Board'
import { Move } from '../Move'
import { AttackTable, PieceColor, PieceLetter } from '../types'
import { Piece } from './piece'

export class Knight extends Piece {
    get notationChar(): PieceLetter {
        return 'N'
    }

    constructor(color: PieceColor) {
        super('knight', color)
    }

    possibleMoves(startSquareNb: number, board: Board, opponentAttackTable: AttackTable): Move[] {
        const moves: Move[] = []

        for (let offset of OFFSETS) {
            const endSquareNb = this.addOffset(startSquareNb, offset)
            this.createMove(moves, startSquareNb, endSquareNb, board, opponentAttackTable, this.notationChar)
        }
        return moves
    }

    updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void {
        this.calculateAttackTable(startSquareNb, board, table, OFFSETS, false)
    }

    get isSliding(): boolean {
        return false
    }
}

const OFFSETS: { file: number; rank: number }[] = [
    { file: 1, rank: 2 },
    { file: 2, rank: 1 },
    { file: 2, rank: -1 },
    { file: 1, rank: -2 },
    { file: -1, rank: -2 },
    { file: -2, rank: -1 },
    { file: -2, rank: 1 },
    { file: -1, rank: 2 },
]
