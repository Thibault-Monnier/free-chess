import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { ColumnRow, PieceColor, PieceName } from '../types'
import { Piece } from './piece'

export class King extends Piece {
    constructor(color: PieceColor) {
        super('king', color)
    }

    // TODO: castling, checks
    possibleMoves(startSquareNb: number, game: Game): Move[] {
        const OFFSETS: ColumnRow[] = [
            { column: 1, row: 1 },
            { column: 1, row: 0 },
            { column: 1, row: -1 },
            { column: 0, row: 1 },
            { column: 0, row: -1 },
            { column: -1, row: 1 },
            { column: -1, row: 0 },
            { column: -1, row: -1 },
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
