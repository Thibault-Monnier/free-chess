import { Board } from '../board'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'

export class Knight {
    public readonly name: PieceName = 'knight'

    constructor(public color: PieceColor) {}

    possibleMoves(startPosition: number, board: Board): Move[] {
        return []
    }
}
