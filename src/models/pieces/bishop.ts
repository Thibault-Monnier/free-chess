import { Game } from '../game'
import { Move } from '../move'
import { PieceColor } from '../types'
import { Piece } from './piece'

export class Bishop extends Piece {
    constructor(color: PieceColor) {
        super('bishop', color)
    }

    possibleMoves(startSquareNb: number, game: Game): Move[] {
        return this.createMovesForRepeatedOffsets(
            startSquareNb,
            [
                { column: 1, row: 1 },
                { column: 1, row: -1 },
                { column: -1, row: 1 },
                { column: -1, row: -1 },
            ],
            game
        )
    }
}
