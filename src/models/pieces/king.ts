import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { ColumnRow, PieceColor, PieceName } from '../types'
import { Piece } from './piece'

export class King extends Piece {
    constructor(color: PieceColor) {
        super('king', color)
    }

    // TODO: checks
    possibleMoves(startSquareNb: number, game: Game): Move[] {
        const OFFSETS: ColumnRow[] = [
            { column: 1, row: 1 },
            { column: 1, row: 0 },
            { column: 1, row: -1 },
            { column: 0, row: 1 },
            { column: 0, row: -1 },
            { column: -1, row: 1 },
            { column: -1, row: 0 },
            { column: -1, row: -1 },
        ]
        const moves: Move[] = []
        const startBoard: Board = game.currentBoard

        for (let offset of OFFSETS) {
            const endSquareNb = this.addOffset(startSquareNb, offset)
            const move = this.createMove(moves, startSquareNb, endSquareNb, game)
            if (move) {
                const canCastle = move.endBoard.canCastle[this.color]
                canCastle.queenSide = false
                canCastle.kingSide = false
            }
        }

        // Castling
        const canCastle = startBoard.canCastle[this.color]
        if (canCastle.queenSide) {
            for (let i = 1; i <= 3; i++) {
                if (game.currentBoard.squares[startSquareNb - i] !== null) {
                    break
                }
                if (i === 3) {
                    console.log('queenSide')
                    createCastling(true)
                }
            }
        }
        if (canCastle.kingSide) {
            for (let i = 1; i <= 2; i++) {
                if (game.currentBoard.squares[startSquareNb + i] !== null) {
                    break
                }
                if (i === 2) {
                    console.log('kingSide')
                    createCastling(false)
                }
            }
        }

        function createCastling(isQueenSideCastling: boolean) {
            const endBoard = new Board(startBoard)
            const endSquareNb = startSquareNb + (isQueenSideCastling ? -2 : 2)
            const rookStartPosition = startSquareNb + (isQueenSideCastling ? -4 : 3)

            endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb]
            endBoard.squares[endSquareNb + (isQueenSideCastling ? 1 : -1)] = endBoard.squares[rookStartPosition]
            endBoard.squares[startSquareNb] = null
            endBoard.squares[rookStartPosition] = null

            moves.push(new Move(endBoard.squares[startSquareNb]!, startSquareNb, endSquareNb, endBoard))
        }

        return moves
    }
}
