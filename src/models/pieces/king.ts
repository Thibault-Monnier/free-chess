import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { fileRank, PieceColor, pieceLetter } from '../types'
import { Piece } from './piece'

export class King extends Piece {
    private pieceLetter: pieceLetter = 'K'

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
            const move = this.createMove(moves, startSquareNb, endSquareNb, game, this.pieceLetter)
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

            let moveNotation = isQueenSideCastling ? 'O-O-O' : 'O-O'
            console.log(moveNotation)

            moves.push(new Move(startBoard.squares[startSquareNb]!, startSquareNb, endSquareNb, endBoard, moveNotation))
        }

        return moves
    }
}
