import { Board } from '../board'
import { Game } from '../game'
import { Move } from '../move'
import { fileRank, PieceColor, PieceLetter, PieceName } from '../types'
import { squareNbToCoordinates, squareNbToFileRank } from '../utils'

export abstract class Piece {
    constructor(public name: PieceName, public color: PieceColor) {}

    abstract possibleMoves(startSquareNb: number, game: Game): Move[]

    addOffset(startSquareNb: number, offset: fileRank): number | null {
        const endSquareNb = startSquareNb + offset.file + offset.rank * 8
        const { file } = squareNbToFileRank(startSquareNb)

        if (endSquareNb < 0 || endSquareNb > 63) return null
        if (file + offset.file < 0) return null
        if (file + offset.file > 7) return null

        return endSquareNb
    }

    createMovesForRepeatedOffsets(
        startSquareNb: number,
        offsets: fileRank[],
        game: Game,
        PieceLetter: PieceLetter
    ): Move[] {
        const moves: Move[] = []
        const startBoard: Board = game.currentBoard

        for (let offset of offsets) {
            let endSquareNb: number | null = startSquareNb

            while (true) {
                endSquareNb = this.addOffset(endSquareNb, offset)
                if (endSquareNb === null) break
                this.createMove(moves, startSquareNb, endSquareNb, game, PieceLetter)
                if (startBoard.squares[endSquareNb]) break
            }
        }
        return moves
    }

    createMove(
        moves: Move[],
        startSquareNb: number,
        endSquareNb: number | null,
        game: Game,
        letter: PieceLetter
    ): Move | undefined {
        if (endSquareNb === null) return

        const startBoard = game.currentBoard
        const endSquarePiece = startBoard.squares[endSquareNb]

        if (!endSquarePiece || endSquarePiece.color !== this.color) {
            const endBoard = new Board(startBoard)

            endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb]
            endBoard.squares[startSquareNb] = null

            const move = new Move(
                this,
                startSquareNb,
                endSquareNb,
                endBoard,
                this.encodeMove(letter, endSquarePiece ? true : false, endSquareNb)
            )
            moves.push(move)
            return move
        }
    }

    private encodeMove(letter: PieceLetter, isCapture: boolean, endSquareNb: number): string {
        const captureSymbol = isCapture ? 'x' : ''
        const endSquareCoordinates = squareNbToCoordinates(endSquareNb)
        return [letter, captureSymbol, endSquareCoordinates].join('')
    }
}
