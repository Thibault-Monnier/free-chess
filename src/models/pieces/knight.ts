import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { PieceColor, pieceLetter } from '../types'
import { Piece } from './piece'

export class Knight extends Piece {
    private pieceLetter: pieceLetter = 'N'

    constructor(color: PieceColor) {
        super('knight', color)
    }

    possibleMoves(startSquareNb: number, game: Game): Move[] {
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
        const startBoard: Board = game.currentBoard

        for (let offset of OFFSETS) {
            const endSquareNb = this.addOffset(startSquareNb, offset)
            this.createMove(moves, startSquareNb, endSquareNb, game, this.pieceLetter)
        }
        return moves
    }
}
