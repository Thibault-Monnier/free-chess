import { Board } from '../board'
import { Move } from '../move'
import { FileRank, AttackTable, PieceColor, PieceLetter, PieceName, PossibleMoveOptions } from '../types'
import { squareNbToCoordinates, squareNbToFileRank } from '../utils'

export abstract class Piece {
    constructor(public name: PieceName, public color: PieceColor) {}

    abstract possibleMoves(
        startSquareNb: number,
        board: Board,
        opponentAttackTable: AttackTable,
        options: PossibleMoveOptions
    ): Move[]
    abstract updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void

    eaten(board: Board): void {}

    addOffset(startSquareNb: number, offset: FileRank): number | null {
        const endSquareNb = startSquareNb + offset.file + offset.rank * 8
        if (endSquareNb < 0 || endSquareNb > 63) return null

        const { file } = squareNbToFileRank(startSquareNb)
        if (file + offset.file < 0) return null
        if (file + offset.file > 7) return null

        return endSquareNb
    }

    createMovesForRepeatedOffsets(
        startSquareNb: number,
        offsets: FileRank[],
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

            if (!options?.skipCheckVerification && endBoard.isInCheck(board.colorToMove)) return

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

    calculateAttackTable(
        startSquareNb: number,
        board: Board,
        table: AttackTable,
        offsets: FileRank[],
        isSlidingPiece: boolean
    ): void {
        for (let offset of offsets) {
            let endSquareNb: number | null = startSquareNb

            do {
                endSquareNb = this.addOffset(endSquareNb, offset)
                if (endSquareNb === null) break
                table.attackedSquares[endSquareNb] = true

                const piece = board.squares[endSquareNb]
                if (piece) {
                    if (piece.color !== this.color && this.isPiecePinned(endSquareNb, board, offset)) {
                        table.pinnedPieces.push({
                            squareNb: endSquareNb,
                            offset,
                        })
                    }
                    break
                }
            } while (isSlidingPiece)
        }
    }

    protected isPiecePinned(startSquareNb: number, board: Board, offset: FileRank): boolean {
        let endSquareNb: number | null = startSquareNb
        while (true) {
            endSquareNb = this.addOffset(endSquareNb, offset)
            if (endSquareNb === null) break

            const piece = board.squares[endSquareNb]
            if (piece) {
                return piece.color !== this.color && piece.name === 'king'
            }
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
