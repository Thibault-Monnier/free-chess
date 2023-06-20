import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'
import { Piece } from './piece'

export class Rook extends Piece {
    constructor(color: PieceColor) {
        super('rook', color)
    }

    possibleMoves(startSquareNb: number, game: Game): Move[] {
        return this.createMovesForRepeatedOffsets(
            startSquareNb,
            [
                { column: 1, row: 0 },
                { column: 0, row: 1 },
                { column: 0, row: -1 },
                { column: -1, row: 0 },
            ],
            game
        )
    }
}
