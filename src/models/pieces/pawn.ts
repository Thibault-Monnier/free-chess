import { Board } from '../board'
import { Move } from '../move'
import { fileRank, PieceColor, PieceLetter, PossibleMoveOptions } from '../types'
import { fileRankToSquareNb, squareNbToFileRank } from '../utils'
import { Piece } from './piece'

export class Pawn extends Piece {
    private static LETTER: PieceLetter = ''

    constructor(color: PieceColor) {
        super('pawn', color)
    }

    // TODO:  promotion
    possibleMoves(startSquareNb: number, board: Board, options: PossibleMoveOptions): Move[] {
        const moves: Move[] = []

        const direction = this.color === 'white' ? 1 : -1

        // Basic moves
        const moveOneSquare = startSquareNb + 8 * direction
        const moveTwoSquares = startSquareNb + 16 * direction
        if (moveOneSquare >= 0 && moveOneSquare <= 63 && board.squares[moveOneSquare] === null) {
            // Advance one square
            this.createMove(moves, startSquareNb, moveOneSquare, board, Pawn.LETTER, options)

            // Advance two squares
            const { rank } = squareNbToFileRank(startSquareNb)
            if (
                board.squares[moveTwoSquares] === null &&
                ((this.color === 'white' && rank === 1) || (this.color === 'black' && rank === 6))
            ) {
                const move = this.createMove(moves, startSquareNb, moveTwoSquares, board, Pawn.LETTER, options)
                if (move) move.endBoard.enPassantTargetSquareNb = moveOneSquare
            }
        }

        const captures: fileRank[] = [
            { file: -1, rank: direction },
            { file: 1, rank: direction },
        ]

        // Basic captures
        for (let capture of captures) {
            const endSquareNb = this.addOffset(startSquareNb, capture)

            if (
                endSquareNb !== null &&
                board.squares[endSquareNb] &&
                board.squares[endSquareNb]!.color !== this.color
            ) {
                this.createMove(moves, startSquareNb, endSquareNb, board, Pawn.LETTER, options)
            }
        }

        // En passant captures
        if (board.enPassantTargetSquareNb !== null) {
            const offsetToTarget = board.enPassantTargetSquareNb - startSquareNb
            if (offsetToTarget === 7 * direction || offsetToTarget === 9 * direction) {
                const move = this.createMove(
                    moves,
                    startSquareNb,
                    board.enPassantTargetSquareNb,
                    board,
                    Pawn.LETTER,
                    options
                )
                if (move) move.endBoard.squares[board.enPassantTargetSquareNb - 8 * direction] = null
            }
        }

        return moves
    }
}
