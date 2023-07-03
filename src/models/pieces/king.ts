import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { fileRank, PieceColor, PieceLetter } from '../types'
import { Piece } from './piece'

export class King extends Piece {
    private static LETTER: PieceLetter = 'K'

    constructor(color: PieceColor) {
        super('king', color)
    }

    // TODO: checks
    possibleMoves(startSquareNb: number, game: Game): Move[] {
        const OFFSETS: fileRank[] = [
            { file: 1, rank: 1 },
            { file: 1, rank: 0 },
            { file: 1, rank: -1 },
            { file: 0, rank: 1 },
            { file: 0, rank: -1 },
            { file: -1, rank: 1 },
            { file: -1, rank: 0 },
            { file: -1, rank: -1 },
        ]
        const moves: Move[] = []
        const startBoard: Board = game.currentBoard

        for (let offset of OFFSETS) {
            const endSquareNb = this.addOffset(startSquareNb, offset)
            const move = this.createMove(moves, startSquareNb, endSquareNb, game, King.LETTER)
            if (move) {
                const canCastle = move.endBoard.canCastle[this.color]
                canCastle.queenSide = false
                canCastle.kingSide = false
            }
        }

        // Castling
        const canCastle = startBoard.canCastle[this.color]
        if (canCastle.queenSide) {
            const isClearPath = this.areSquaresEmpty(startBoard, [
                startSquareNb - 1,
                startSquareNb - 2,
                startSquareNb - 3,
            ])
            if (isClearPath) {
                const move = this.createCastling(startBoard, startSquareNb, true)
                moves.push(move)
            }
        }
        if (canCastle.kingSide) {
            const isClearPath = this.areSquaresEmpty(startBoard, [startSquareNb + 1, startSquareNb + 2])
            if (isClearPath) {
                const move = this.createCastling(startBoard, startSquareNb, false)
                moves.push(move)
            }
        }

        return moves
    }

    private areSquaresEmpty(board: Board, squareNbs: number[]): boolean {
        return squareNbs.every((squareNb) => !board.squares[squareNb])
    }

    private createCastling(startBoard: Board, startSquareNb: number, isQueenSideCastling: boolean): Move {
        const endBoard = new Board(startBoard)
        const endSquareNb = startSquareNb + (isQueenSideCastling ? -2 : 2)
        const rookStartPosition = startSquareNb + (isQueenSideCastling ? -4 : 3)

        endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb]
        endBoard.squares[endSquareNb + (isQueenSideCastling ? 1 : -1)] = endBoard.squares[rookStartPosition]
        endBoard.squares[startSquareNb] = null
        endBoard.squares[rookStartPosition] = null

        let moveNotation = isQueenSideCastling ? 'O-O-O' : 'O-O'
        console.log(moveNotation)

        return new Move(startBoard.squares[startSquareNb]!, startSquareNb, endSquareNb, endBoard, moveNotation)
    }
}
