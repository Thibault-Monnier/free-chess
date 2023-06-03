import { Board } from '../board'
import { Move } from '../move'
import { PieceColor, PieceName } from '../utils'

export class King {
    public readonly name: PieceName = 'king'

    constructor(public color: PieceColor) {}

    possibleMoves(startPosition: number, board: Board): Move[] {
        const OFFSETS = [-9, -8, -7, -1, 1, 7, 8, 9]
        const moves: Move[] = []
        for (let offset of OFFSETS) {
            const endPosition = startPosition + offset

            if (endPosition < 0 || endPosition > 63) continue
            if (
                Math.abs(
                    Math.floor(startPosition / 8) - Math.floor(endPosition / 8)
                ) >= 2
            )
                continue

            moves.push(new Move(this, startPosition))
        }
        return moves
    }
}
