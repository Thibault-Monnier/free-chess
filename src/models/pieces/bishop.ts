import { Game } from '../game'
import { Move } from '../move'
import { PieceColor, PieceLetter } from '../types'
import { Piece } from './piece'

export class Bishop extends Piece {
    constructor(color: PieceColor) {
        super('bishop', color)
    }

    possibleMoves(startSquareNb: number, game: Game): Move[] {
        return this.createMovesForRepeatedOffsets(
            startSquareNb,
            [
                { file: 1, rank: 1 },
                { file: 1, rank: -1 },
                { file: -1, rank: 1 },
                { file: -1, rank: -1 },
            ],
            game, 'B'
        )
    }
}
