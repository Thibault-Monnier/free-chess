import { Board } from '../board'
import { Move } from '../move'
import { AttackTable, PieceColor } from '../types'
import { Piece } from './piece'

export class Rook extends Piece {
    constructor(color: PieceColor) {
        super('rook', color)
    }

    possibleMoves(startSquareNb: number, board: Board, opponentAttackTable: AttackTable): Move[] {
        const moves = this.createMovesForRepeatedOffsets(startSquareNb, OFFSETS, board, opponentAttackTable, 'R')

        const isQueenSquare = (this.color === 'white' ? 0 : 56) === startSquareNb
        const isKingSquare = (this.color === 'white' ? 7 : 63) === startSquareNb
        if (isQueenSquare || isKingSquare) {
            moves.forEach((move) => {
                move.endBoard.canCastle[this.color][isQueenSquare ? 'queenSide' : 'kingSide'] = false
            })
        }

        return moves
    }

    eaten(board: Board): void {
        if (this.color === 'white') {
            if (board.squares[0] === this) board.canCastle[this.color].queenSide = false
            if (board.squares[7] === this) board.canCastle[this.color].kingSide = false
        } else {
            if (board.squares[56] === this) board.canCastle[this.color].queenSide = false
            if (board.squares[63] === this) board.canCastle[this.color].kingSide = false
        }
    }

    updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void {
        this.calculateAttackTable(startSquareNb, board, table, OFFSETS, true)
    }
}

const OFFSETS = [
    { file: 1, rank: 0 },
    { file: 0, rank: 1 },
    { file: 0, rank: -1 },
    { file: -1, rank: 0 },
]
