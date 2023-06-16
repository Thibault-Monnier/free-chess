import { Game } from '../game'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'
import { Piece } from './piece'

export class Queen extends Piece {
    constructor(color: PieceColor) {
        super('queen', color)
    }

    possibleMoves(startSquareNb: number, game: Game): Move[] {
        return []
    }
}
