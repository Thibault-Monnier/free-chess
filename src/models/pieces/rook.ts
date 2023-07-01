import { Game } from '../game'
import { Move } from '../move'
import { PieceColor } from '../types'
import { Piece } from './piece'

export class Rook extends Piece {
    constructor(color: PieceColor) {
        super('rook', color)
    }

    possibleMoves(startSquareNb: number, game: Game): Move[] {
        const moves = this.createMovesForRepeatedOffsets(
            startSquareNb,
            [
                { column: 1, row: 0 },
                { column: 0, row: 1 },
                { column: 0, row: -1 },
                { column: -1, row: 0 },
            ],
            game
        )

        const isQueenSquare = (this.color === 'white' ? 0 : 56) === startSquareNb
        const isKingSquare = (this.color === 'white' ? 7 : 63) === startSquareNb
        if (isQueenSquare || isKingSquare) {
            moves.forEach((move) => {
                move.endBoard.canCastle[this.color][isQueenSquare ? 'queenSide' : 'kingSide'] = false
            })
        }

        return moves
    }
}
