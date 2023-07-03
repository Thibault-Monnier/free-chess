import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { fileRank, PieceColor, PieceLetter } from '../types'
import { fileRankToSquareNb, squareNbToFileRank } from '../utils'
import { Piece } from './piece'

export class Pawn extends Piece {
    private static LETTER: PieceLetter = ''

    constructor(color: PieceColor) {
        super('pawn', color)
    }

    // TODO:  promotion
    possibleMoves(startSquareNb: number, game: Game): Move[] {
        const startBoard: Board = game.currentBoard
        const moves: Move[] = []

        const direction = this.color === 'white' ? 1 : -1

        // Basic moves
        const moveOneSquare = startSquareNb + 8 * direction
        const moveTwoSquares = startSquareNb + 16 * direction
        if (moveOneSquare >= 0 && moveOneSquare <= 63 && startBoard.squares[moveOneSquare] === null) {
            // Advance one square
            this.createMove(moves, startSquareNb, moveOneSquare, game, Pawn.LETTER)

            // Advance two squares
            const { rank } = squareNbToFileRank(startSquareNb)
            if (
                startBoard.squares[moveTwoSquares] === null &&
                ((this.color === 'white' && rank === 1) || (this.color === 'black' && rank === 6))
            ) {
                this.createMove(moves, startSquareNb, moveTwoSquares, game, Pawn.LETTER)
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
                startBoard.squares[endSquareNb] &&
                startBoard.squares[endSquareNb]!.color !== this.color
            ) {
                this.createMove(moves, startSquareNb, endSquareNb, game, Pawn.LETTER)
            }
        }

        // En passant captures
        if (game.lastMove?.piece.name === 'pawn') {
            const { file, rank } = squareNbToFileRank(startSquareNb)
            const { file: opponentfile, rank: opponentrank } = squareNbToFileRank(game.lastMove.endSquareNb)
            const { rank: opponentStartrank } = squareNbToFileRank(game.lastMove.startSquareNb)

            if (
                (this.color === 'white'
                    ? opponentStartrank === 6 && opponentrank === 4
                    : opponentStartrank === 1 && opponentrank === 3) &&
                rank === opponentrank &&
                Math.abs(file - opponentfile) === 1
            ) {
                const endSquareNb = fileRankToSquareNb({ file: opponentfile, rank: rank + direction })
                this.createMove(moves, startSquareNb, endSquareNb, game, Pawn.LETTER)
                moves[moves.length - 1].endBoard.squares[game.lastMove.endSquareNb] = null
            }
        }

        return moves
    }
}
