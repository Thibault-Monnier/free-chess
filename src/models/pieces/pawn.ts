import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'
import { squareNbToColumnRow } from '../utils'
import { Piece } from './piece'

export class Pawn extends Piece {
    constructor(color: PieceColor) {
        super('pawn', color)
    }

    //TODO: en passant, promotion, capture
    possibleMoves(startSquareNb: number, game: Game): Move[] {
        const startBoard: Board = game.currentBoard
        const moves: Move[] = []

        const direction = this.color === 'white' ? 1 : -1

        const moveOneSquare = startSquareNb + 8 * direction
        const moveTwoSquares = startSquareNb + 16 * direction

        if (moveOneSquare >= 0 && moveOneSquare <= 63 && startBoard.squares[moveOneSquare] === null) {
            this.createMove(moves, startSquareNb, moveOneSquare, game)

            const { row } = squareNbToColumnRow(startSquareNb)
            if (
                startBoard.squares[moveTwoSquares] === null &&
                ((this.color === 'white' && row === 1) || (this.color === 'black' && row === 6))
            ) {
                this.createMove(moves, startSquareNb, moveTwoSquares, game)
            }
        }

        return moves
    }
}
