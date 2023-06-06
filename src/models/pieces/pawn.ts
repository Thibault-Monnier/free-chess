import { Board } from '../board'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'

export class Pawn {
    public readonly name: PieceName = 'pawn'

    constructor(public color: PieceColor) {}

    possibleMoves(startPosition: number, board: Board): Move[] {
        return []
    }
}
