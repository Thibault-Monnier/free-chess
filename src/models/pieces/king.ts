import { Board } from '../board'
import { Move } from '../move'
import { PieceColor, PieceName } from '../utils'

export class King {
    public readonly name: PieceName = 'king'

    constructor(public color: PieceColor) {}

    possibleMoves(startSquareNb: number, board: Board): Move[] {
        const OFFSETS = [-9, -8, -7, -1, 1, 7, 8, 9]
        const moves: Move[] = []
        for (let offset of OFFSETS) {
            const endSquareNb = startSquareNb + offset

            if (endSquareNb < 0 || endSquareNb > 63) continue
            if (
                Math.abs(
                    Math.floor(startSquareNb / 8) - Math.floor(endSquareNb / 8)
                ) >= 2
            )
                continue

            moves.push(new Move(this, startSquareNb, endSquareNb))
        }
        return moves
    }
}
