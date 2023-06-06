import { Board } from '../board'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'

export class Rook {
    public readonly name: PieceName = 'rook'

    constructor(public color: PieceColor) {}

    possibleMoves(startPosition: number, board: Board): Move[] {
        return []
    }
}
