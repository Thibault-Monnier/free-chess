import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'
import { Piece } from './piece'

export class Pawn extends Piece {
    constructor(color: PieceColor) {
        super('pawn', color)
    }

    possibleMoves(startSquareNb: number, game: Game): Move[] {
        const moves: Move[] = []
        const direction = this.color === 'white' ? 1 : -1
        const startBoard: Board = game.currentBoard

        const endSquareNb = startSquareNb + 8 * direction

        if (endSquareNb >= 0 && endSquareNb <= 63 && startBoard.squares[endSquareNb] === null) {
            const endBoard: Board = new Board(startBoard)
            endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb]
            endBoard.squares[startSquareNb] = null

            moves.push(new Move(this, startSquareNb, endSquareNb, endBoard))
        }

        return moves
    }
}
