import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { ColumnRow, PieceColor, PieceName } from '../types'
import { squareNbToColumnRow } from '../utils'
import { Piece } from './piece'

export class Pawn extends Piece {
    constructor(color: PieceColor) {
        super('pawn', color)
    }

    //TODO: en passant, promotion, capture
    possibleMoves(startSquareNb: number, game: Game): Move[] {
        const startBoard: Board = game.currentBoard
        const moves: Move[] = []

        const direction = this.color === 'white' ? 1 : -1

        //Basic moves
        const moveOneSquare = startSquareNb + 8 * direction
        const moveTwoSquares = startSquareNb + 16 * direction
        if (moveOneSquare >= 0 && moveOneSquare <= 63 && startBoard.squares[moveOneSquare] === null) {
            //Advance one square
            this.createMove(moves, startSquareNb, moveOneSquare, game)

            //Advance two squares
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

        //Basic captures
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

        //En passant captures
        if (game.lastMove) {
            if (
                game.lastMove.piece.name === 'pawn' &&
                game.lastMove.endSquareNb - game.lastMove.startSquareNb === -(16 * direction) &&
                squareNbToColumnRow(startSquareNb).row === squareNbToColumnRow(game.lastMove.endSquareNb).row
            ) {
                if (startSquareNb === game.lastMove.endSquareNb + 1) {
                    const endSquareNb = this.addOffset(startSquareNb, { column: -1, row: direction })
                    if (endSquareNb !== null) {
                        this.createMove(moves, startSquareNb, endSquareNb, game, true)
                    }
                }
                if (startSquareNb === game.lastMove.endSquareNb - 1) {
                    const endSquareNb = this.addOffset(startSquareNb, { column: 1, row: direction })
                    if (endSquareNb !== null) {
                        this.createMove(moves, startSquareNb, endSquareNb, game, true)
                    }
                }
            }
        }

        return moves
    }
}
