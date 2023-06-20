import { Game } from '../game'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'
import { Piece } from './piece'

export class Queen extends Piece {
    constructor(color: PieceColor) {
        super('queen', color)
    }

    possibleMoves(startSquareNb: number, game: Game): Move[] {
        return this.createMovesForRepeatedOffsets(
            startSquareNb,
            [
                { column: 1, row: 1 },
                { column: 1, row: 0 },
                { column: 1, row: -1 },
                { column: 0, row: 1 },
                { column: 0, row: -1 },
                { column: -1, row: 1 },
                { column: -1, row: 0 },
                { column: -1, row: -1 },
            ],
            game
        )
    }
}
