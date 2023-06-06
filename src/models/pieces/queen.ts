import { Board } from '../board'
import { Move } from '../move'
import { PieceColor, PieceName } from '../types'

export class Queen {
    public readonly name: PieceName = 'queen'

    constructor(public color: PieceColor) {}

    possibleMoves(startPosition: number, board: Board): Move[] {
        return []
    }
}
