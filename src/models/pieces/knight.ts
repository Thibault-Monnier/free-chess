import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'
import { Piece } from './piece'

export class Knight extends Piece {
    constructor(color: PieceColor) {
        super('knight', color)
    }

    possibleMoves(startSquareNb: number, game: Game): Move[] {
        const OFFSETS: { column: number; row: number }[] = [
            { column: 1, row: 2 },
            { column: 2, row: 1 },
            { column: 2, row: -1 },
            { column: 1, row: -2 },
            { column: -1, row: -2 },
            { column: -2, row: -1 },
            { column: -2, row: 1 },
            { column: -1, row: 2 },
        ]
        const moves: Move[] = []
        const startBoard: Board = game.currentBoard

        for (let offset of OFFSETS) {
            const endSquareNb = this.addOffset(startSquareNb, offset)
            this.createMove(moves, startSquareNb, endSquareNb, game)
        }
        return moves
    }
}
