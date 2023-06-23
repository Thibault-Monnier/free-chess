import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { ColumnRow, PieceColor, PieceName } from '../types'
import { squareNbToColumnRow } from '../utils'

export abstract class Piece {
    constructor(public name: PieceName, public color: PieceColor) {}

    abstract possibleMoves(startSquareNb: number, game: Game): Move[]

    addOffset(startSquareNb: number, offset: ColumnRow): number | null {
        const endSquareNb = startSquareNb + offset.column + offset.row * 8
        const { column } = squareNbToColumnRow(startSquareNb)

        if (endSquareNb < 0 || endSquareNb > 63) return null
        if (column + offset.column < 0) return null
        if (column + offset.column > 7) return null

        return endSquareNb
    }

    createMovesForRepeatedOffsets(startSquareNb: number, offsets: ColumnRow[], game: Game): Move[] {
        const moves: Move[] = []
        const startBoard: Board = game.currentBoard

        for (let offset of offsets) {
            let endSquareNb: number | null = startSquareNb

            while (true) {
                endSquareNb = this.addOffset(endSquareNb, offset)
                if (endSquareNb === null) break
                this.createMove(moves, startSquareNb, endSquareNb, game)
                if (startBoard.squares[endSquareNb]) break
            }
        }
        return moves
    }

    createMove(moves: Move[], startSquareNb: number, endSquareNb: number | null, game: Game, enPassant?: boolean): void {
        if (endSquareNb === null) return

        const startBoard = game.currentBoard
        const endSquarePiece = startBoard.squares[endSquareNb]

        if (!endSquarePiece || endSquarePiece.color !== this.color) {
            const endBoard = new Board(startBoard)

            endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb]
            endBoard.squares[startSquareNb] = null

            moves.push(new Move(this, startSquareNb, endSquareNb, endBoard))

            if (enPassant) {
                endBoard.squares[endSquareNb + (this.color === 'white' ? -8 : 8)] = null
            }
        }
    }
}
