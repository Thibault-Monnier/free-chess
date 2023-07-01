import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { ColumnRow, PieceColor, PieceName } from '../types'
import { columnRowToSquareNb, squareNbToColumnRow } from '../utils'
import { Piece } from './piece'

export class Pawn extends Piece {
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
            this.createMove(moves, startSquareNb, moveOneSquare, game)

            // Advance two squares
            const { row } = squareNbToColumnRow(startSquareNb)
            if (
                startBoard.squares[moveTwoSquares] === null &&
                ((this.color === 'white' && row === 1) || (this.color === 'black' && row === 6))
            ) {
                this.createMove(moves, startSquareNb, moveTwoSquares, game)
            }
        }

        const captures: ColumnRow[] = [
            { column: -1, row: direction },
            { column: 1, row: direction },
        ]

        // Basic captures
        for (let capture of captures) {
            const endSquareNb = this.addOffset(startSquareNb, capture)

            if (
                endSquareNb !== null &&
                startBoard.squares[endSquareNb] &&
                startBoard.squares[endSquareNb]!.color !== this.color
            ) {
                this.createMove(moves, startSquareNb, endSquareNb, game)
            }
        }

        // En passant captures
        if (game.lastMove?.piece.name === 'pawn') {
            const { column, row } = squareNbToColumnRow(startSquareNb)
            const { column: opponentColumn, row: opponentRow } = squareNbToColumnRow(game.lastMove.endSquareNb)
            const { row: opponentStartRow } = squareNbToColumnRow(game.lastMove.startSquareNb)

            if (
                (this.color === 'white'
                    ? opponentStartRow === 6 && opponentRow === 4
                    : opponentStartRow === 1 && opponentRow === 3) &&
                row === opponentRow &&
                Math.abs(column - opponentColumn) === 1
            ) {
                const endSquareNb = columnRowToSquareNb({ column: opponentColumn, row: row + direction })
                this.createMove(moves, startSquareNb, endSquareNb, game)
                moves[moves.length - 1].endBoard.squares[game.lastMove.endSquareNb] = null
            }
        }

        return moves
    }
}
