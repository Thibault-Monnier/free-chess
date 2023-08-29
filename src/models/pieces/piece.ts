import { Board } from '../board'
import { Move } from '../move'
import { FileRank, AttackTable, PieceColor, PieceLetter, PieceName } from '../types'
import {
    calculateOffset,
    fileRankToSquareNb,
    invertColor,
    isBetweenSquares,
    squareNbToCoordinates,
    squareNbToFileRank,
} from '../utils'

export abstract class Piece {
    constructor(public name: PieceName, public color: PieceColor) {}

    abstract possibleMoves(startSquareNb: number, board: Board, opponentAttackTable: AttackTable): Move[]
    abstract updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void
    abstract get isSliding(): boolean

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
        opponentAttackTable: AttackTable,
        PieceLetter: PieceLetter
    ): Move[] {
        const moves: Move[] = []

        for (let offset of offsets) {
            let endSquareNb: number | null = startSquareNb

            while (true) {
                endSquareNb = this.addOffset(endSquareNb, offset)
                if (endSquareNb === null) break
                this.createMove(moves, startSquareNb, endSquareNb, board, opponentAttackTable, PieceLetter)
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
        opponentAttackTable: AttackTable,
        letter: PieceLetter,
        postMove?: (endBoard: Board) => void
    ): void {
        if (endSquareNb === null) return

        const endSquarePiece = board.squares[endSquareNb]

        if (!endSquarePiece || endSquarePiece.color !== this.color) {
            const endBoard = new Board(board, { switchColor: true, resetEnPassant: true })

            if (endSquarePiece) endSquarePiece.eaten(endBoard)

            endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb]
            endBoard.squares[startSquareNb] = null

            if (postMove) postMove(endBoard)

            if (this.inCheckAfterMove(startSquareNb, endSquareNb, board, endBoard, opponentAttackTable)) return

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
                    if (piece.color !== this.color && piece.name === 'king') {
                        table.kingAttackers.push(startSquareNb)
                    }

                    if (isSlidingPiece) {
                        if (piece.color !== this.color && this.isPiecePinned(endSquareNb, board, offset)) {
                            table.pinnedPieces.push({
                                squareNb: endSquareNb,
                                offset,
                            })
                        }
                        break
                    }
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

    private inCheckAfterMove(
        startSquareNb: number,
        endSquareNb: number,
        board: Board,
        endBoard: Board,
        opponentAttackTable: AttackTable
    ): boolean {
        const kingAttackers = opponentAttackTable.kingAttackers
        const piece = board.squares[startSquareNb]!

        if (piece.name === 'king') {
            if (opponentAttackTable.attackedSquares[endSquareNb]) return true

            // If the king is attacked by a sliding piece, check that it does not move alongside the attack axis
            for (let kingAttacker of kingAttackers) {
                if (!board.squares[kingAttacker]?.isSliding) continue
                const offset = calculateOffset(kingAttacker, startSquareNb)
                if (endSquareNb === startSquareNb + offset) return true
            }
        } else {
            const pinnedPiece = opponentAttackTable.pinnedPieces.find(
                (pinnedPiece) => pinnedPiece.squareNb === startSquareNb
            )
            if (pinnedPiece && (startSquareNb - endSquareNb) % fileRankToSquareNb(pinnedPiece.offset) !== 0) return true

            if (kingAttackers.length > 1) return true

            if (kingAttackers.length === 1) {
                const kingAttackerSquareNb = kingAttackers[0]
                const kingSquareNb = endBoard.squares.findIndex(
                    (piece) => piece?.name === 'king' && piece.color === this.color
                )
                const kingAttacker = board.squares[kingAttackerSquareNb]!
                let isAttackStopped = false

                // The move captures the attacking piece (normal capture + en passant)
                if (endBoard.squares[kingAttackerSquareNb] !== board.squares[kingAttackerSquareNb]) {
                    isAttackStopped = true
                }

                // The move intersects the attack axis
                if (
                    !isAttackStopped &&
                    kingAttacker.isSliding &&
                    isBetweenSquares(kingAttackerSquareNb, endSquareNb, kingSquareNb)
                ) {
                    isAttackStopped = true
                }

                if (!isAttackStopped) return true
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
