import { Game } from '../game'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'

export abstract class Piece {
    constructor(public name: PieceName, public color: PieceColor) {}

    abstract possibleMoves(startSquareNb: number, game: Game): Move[]
}
