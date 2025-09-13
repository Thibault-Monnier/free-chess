import { Board } from '../Board'
import { SerializedPiece } from '../serializedTypes'
import { Move } from '../Move'
import { FileRank, AttackTable, PieceColor, PieceName, MoveType } from '../types'
import { calculateAxisOffset, isBetweenSquares, squareNbToFileRank } from '../utils'

export abstract class Piece {
    protected constructor(public name: PieceName, public color: PieceColor) {}

    abstract possibleMoves(startSquareNb: number, board: Board, opponentAttackTable: AttackTable): Move[]
    abstract updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void
    abstract get isSliding(): boolean

    serialize(): SerializedPiece {
        return this
    }

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
        opponentAttackTable: AttackTable
    ): Move[] {
        const moves: Move[] = []

        for (let offset of offsets) {
            let endSquareNb: number | null = startSquareNb

            while (true) {
                endSquareNb = this.addOffset(endSquareNb, offset)
                if (endSquareNb === null) break
                this.createMove(moves, startSquareNb, endSquareNb, board, opponentAttackTable)
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
        postMove?: (endBoard: Board) => void,
        isPromotion = false
    ): void {
        if (endSquareNb === null) return

        let moveType: MoveType = isPromotion ? 'promotion' : 'normal'

        if (board.squares[startSquareNb]?.name === 'pawn' && board.enPassantTargetSquareNb === endSquareNb) {
            // En passant capture
            moveType = 'capture'
            if (!this.isEnPassantLegal(startSquareNb, board)) return
        }

        const endSquarePiece = board.squares[endSquareNb]

        if (!endSquarePiece || endSquarePiece.color !== this.color) {
            const endBoard = new Board(board, { switchColor: true, resetEnPassant: true })

            if (endSquarePiece) {
                moveType = isPromotion ? 'capturePromotion' : 'capture'
                endSquarePiece.eaten(endBoard)
            }

            endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb]
            endBoard.squares[startSquareNb] = null

            if (postMove) postMove(endBoard)

            if (this.inCheckAfterMove(startSquareNb, endSquareNb, board, endBoard, opponentAttackTable)) return

            let fiftyMovesRuleCounter = board.fiftyMovesRuleCounter + 1
            if (fiftyMovesRuleCounter >= 100) return
            if (this.name === 'pawn' || moveType === 'capture') fiftyMovesRuleCounter = 0 // Capture promotions are pawn moves anyway
            endBoard.fiftyMovesRuleCounter = fiftyMovesRuleCounter

            const move = new Move(this, startSquareNb, endSquareNb, endBoard, moveType)
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
        const kingSquareNb = board.squares.findIndex((piece) => piece?.name === 'king' && piece.color !== this.color)
        return this.firstPieceOnAxis(startSquareNb, board, offset) === board.squares[kingSquareNb]
    }

    private firstPieceOnAxis(startSquareNb: number, board: Board, offset: FileRank): Piece | null {
        let endSquareNb: number | null = startSquareNb
        while (true) {
            endSquareNb = this.addOffset(endSquareNb, offset)
            if (endSquareNb === null) break

            const piece = board.squares[endSquareNb]
            if (piece) return piece
        }

        return null
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

                const offset = calculateAxisOffset(kingAttacker, startSquareNb)
                if (endSquareNb === startSquareNb + offset) return true
            }
        } else {
            if (!kingAttackers.length && !opponentAttackTable.pinnedPieces.length) return false
            const pinnedPiece = opponentAttackTable.pinnedPieces.find(
                (pinnedPiece) => pinnedPiece.squareNb === startSquareNb
            )

            if (pinnedPiece) {
                const startFileRank = squareNbToFileRank(startSquareNb)
                const endFileRank = squareNbToFileRank(endSquareNb)
                const moveOffset = {
                    file: endFileRank.file - startFileRank.file,
                    rank: endFileRank.rank - startFileRank.rank,
                }
                const pinDirection = pinnedPiece.offset
                if (moveOffset.file * pinDirection.rank !== moveOffset.rank * pinDirection.file) return true
            }

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

    private isEnPassantLegal(startSquareNb: number, board: Board): boolean {
        const kingSquareNb = board.squares.findIndex((piece) => piece?.name === 'king' && piece.color === this.color)

        const fromSquare = squareNbToFileRank(startSquareNb)
        const toSquare = squareNbToFileRank(kingSquareNb)
        const direction = {
            file: toSquare.file - fromSquare.file,
            rank: toSquare.rank - fromSquare.rank,
        }
        const offset = {
            file: Math.sign(direction.file),
            rank: Math.sign(direction.rank),
        }

        if (
            offset.file !== 0 &&
            offset.rank !== 0 &&
            Math.abs(direction.file) !== Math.abs(direction.rank / offset.rank)
        ) {
            // The pawn-to-king offset isn't a possible movement offset
            return true
        } else {
            const offset = calculateAxisOffset(startSquareNb, kingSquareNb)

            let squareNb = startSquareNb

            // Check that there is a enemy sliding piece attacking the pawn through the pawn-to-king offset
            // "offset" is the pawn-to-king offset so it needs to be reversed
            const firstPieceOnAxis = this.firstPieceOnAxis(squareNb, board, squareNbToFileRank(-offset))
            if (firstPieceOnAxis && firstPieceOnAxis.color !== this.color && firstPieceOnAxis.isSliding) {
                if (Math.abs(offset) === 1 || Math.abs(offset) === 8) {
                    // The offset is a file or rank offset
                    if (firstPieceOnAxis.name !== 'rook' && firstPieceOnAxis.name !== 'queen') return true
                } else {
                    // The offset is a diagonal offset
                    if (firstPieceOnAxis.name !== 'bishop' && firstPieceOnAxis.name !== 'queen') return true
                }

                const kingSquareNb = board.squares.findIndex(
                    (piece) => piece?.name === 'king' && piece.color === this.color
                )

                if (
                    this.firstPieceOnAxis(squareNb + offset, board, squareNbToFileRank(offset)) ===
                    board.squares[kingSquareNb]
                ) {
                    // Check there is nothing between the pawn and the king
                    // Skip the first square (the pawn's square) so that the captured pawn's square isn't checked
                    return false
                }
            }

            // The first piece on the offset can't be pinning the pawn
            return true
        }
    }
}
