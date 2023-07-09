import { Board } from '../board'
import { Move } from '../move'
import { fileRank, PieceColor, PieceLetter, PieceName, PossibleMoveOptions } from '../types'
import { squareNbToCoordinates, squareNbToFileRank } from '../utils'

export abstract class Piece {
    constructor(public name: PieceName, public color: PieceColor) {}

    abstract possibleMoves(startSquareNb: number, board: Board, options: PossibleMoveOptions): Move[]

    eaten(board: Board): void {}

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
        board: Board,
        PieceLetter: PieceLetter,
        options: PossibleMoveOptions
    ): Move[] {
        const moves: Move[] = []

        for (let offset of offsets) {
            let endSquareNb: number | null = startSquareNb

            while (true) {
                endSquareNb = this.addOffset(endSquareNb, offset)
                if (endSquareNb === null) break
                this.createMove(moves, startSquareNb, endSquareNb, board, PieceLetter, options)
                if (board.squares[endSquareNb]) break
            }
        }
        return moves
    }

    createMove(
        moves: Move[],
        startSquareNb: number,
        endSquareNb: number | null,
        board: Board,
        letter: PieceLetter,
        options: PossibleMoveOptions,
        postMove?: (endBoard: Board) => void
    ): void {
        if (endSquareNb === null) return

        const endSquarePiece = board.squares[endSquareNb]

        if (!endSquarePiece || endSquarePiece.color !== this.color) {
            const endBoard = new Board(board, { switchColor: true, resetEnPassant: true })

            const piece = endBoard.squares[endSquareNb]
            if (piece) piece.eaten(endBoard)

            endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb]
            endBoard.squares[startSquareNb] = null

            if (postMove) postMove(endBoard)

            if (!options?.skipCheckVerification && this.isInCheck(endBoard)) return

            const move = new Move(
                this,
                startSquareNb,
                endSquareNb,
                endBoard,
                this.encodeMove(letter, endSquarePiece ? true : false, startSquareNb, endSquareNb)
            )
            moves.push(move)
        }
    }

    private isInCheck(board: Board): boolean {
        const kingSquareNb = board.squares.findIndex((piece) => piece?.name === 'king' && piece.color === this.color)
        return this.areSquaresAttacked(board, kingSquareNb)
    }

    //Worst possible code in terms of optimization, change when optimizing
    public areSquaresAttacked(board: Board, ...targetSquareNbs: number[]): boolean {
        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const piece = board.squares[squareNb]
            if (!piece || piece.color === this.color) continue

            const moves = piece.possibleMoves(squareNb, board, { skipCheckVerification: true })
            if (moves.some((move) => targetSquareNbs.includes(move.endSquareNb))) return true
        }
        return false
    }

    private encodeMove(letter: PieceLetter, isCapture: boolean, startSquareNb: number, endSquareNb: number): string {
        const captureSymbol = isCapture ? 'x' : ''
        const endSquareCoordinates = squareNbToCoordinates(endSquareNb)
        let file = ''
        if (isCapture && letter === '') file = squareNbToCoordinates(startSquareNb)[0]

        return [letter === '' ? file : letter, captureSymbol, endSquareCoordinates].join('')
    }
}
