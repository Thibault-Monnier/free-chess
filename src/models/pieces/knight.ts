import { Board } from '../board'
import { Move } from '../move'
import { PieceColor, PossibleMoveOptions } from '../types'
import { Piece } from './piece'

export class Knight extends Piece {
    constructor(color: PieceColor) {
        super('knight', color)
    }

    possibleMoves(startSquareNb: number, board: Board, options: PossibleMoveOptions): Move[] {
        const OFFSETS: { file: number; rank: number }[] = [
            { file: 1, rank: 2 },
            { file: 2, rank: 1 },
            { file: 2, rank: -1 },
            { file: 1, rank: -2 },
            { file: -1, rank: -2 },
            { file: -2, rank: -1 },
            { file: -2, rank: 1 },
            { file: -1, rank: 2 },
        ]
        const moves: Move[] = []

        for (let offset of OFFSETS) {
            const endSquareNb = this.addOffset(startSquareNb, offset)
            this.createMove(moves, startSquareNb, endSquareNb, board, 'N', options)
        }
        return moves
    }
}
