import { Game } from '../game'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'
import { Piece } from './piece'

export class Knight extends Piece {
    constructor(color: PieceColor) {
        super('knight', color)
    }

    possibleMoves(startSquareNb: number, game: Game): Move[] {
        return []
    }
}
