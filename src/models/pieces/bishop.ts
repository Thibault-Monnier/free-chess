import { Board } from '../board'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'

export class Bishop {
    public readonly name: PieceName = 'bishop'

    constructor(public color: PieceColor) {}

    possibleMoves(startPosition: number, board: Board): Move[] {
        return []
    }
}
