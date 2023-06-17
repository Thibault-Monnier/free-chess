import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'
import { Piece } from './piece'

export class King extends Piece {
    constructor(color: PieceColor) {
        super('king', color)
    }

    // TODO: captures, castling, checks
    possibleMoves(startSquareNb: number, game: Game): Move[] {
        const OFFSETS = [-9, -8, -7, -1, 1, 7, 8, 9]
        const moves: Move[] = []
        const startBoard: Board = game.currentBoard

        for (let offset of OFFSETS) {
            const endSquareNb = startSquareNb + offset

            if (endSquareNb < 0 || endSquareNb > 63) continue
            if (
                Math.abs(
                    Math.floor(startSquareNb / 8) - Math.floor(endSquareNb / 8)
                ) >= 2 ||
                Math.abs(
                    Math.floor(startSquareNb % 8) - Math.floor(endSquareNb % 8)
                ) >= 2
            )
                continue

            const endBoard: Board = new Board(startBoard)
            endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb]
            endBoard.squares[startSquareNb] = null

            moves.push(new Move(this, startSquareNb, endSquareNb, endBoard))
        }
        return moves
    }
}
