import { Board } from '../board'
import { Move } from '../move'
import { FileRank, AttackTable, PieceColor, PieceLetter } from '../types'
import { squareNbToFileRank } from '../utils'
import { Piece } from './piece'
import { Queen } from './queen'

export class Pawn extends Piece {
    private static LETTER: PieceLetter = ''

    constructor(color: PieceColor) {
        super('pawn', color)
    }

    possibleMoves(startSquareNb: number, board: Board, opponentAttackTable: AttackTable): Move[] {
        const moves: Move[] = []

        // Basic moves
        const moveOneSquareForward = this.addOffset(startSquareNb, squareNbToFileRank(8 * this.direction))
        const moveTwoSquaresForward = this.addOffset(startSquareNb, squareNbToFileRank(16 * this.direction))
        const { rank: startRank } = squareNbToFileRank(startSquareNb)
        const promotionStartRank = this.color === 'white' ? 6 : 1

        if (moveOneSquareForward !== null && board.squares[moveOneSquareForward] === null) {
            // Advance one square if not eligible for promotion
            if (startRank !== promotionStartRank) {
                this.createMove(moves, startSquareNb, moveOneSquareForward, board, opponentAttackTable, Pawn.LETTER)
            }

            // Advance two squares
            if (
                moveTwoSquaresForward !== null &&
                board.squares[moveTwoSquaresForward] === null &&
                ((this.color === 'white' && startRank === 1) || (this.color === 'black' && startRank === 6))
            ) {
                this.createMove(
                    moves,
                    startSquareNb,
                    moveTwoSquaresForward,
                    board,
                    opponentAttackTable,
                    Pawn.LETTER,
                    (endBoard) => {
                        endBoard.enPassantTargetSquareNb = moveOneSquareForward
                    }
                )
            }
        }

        const createPromotionMove = (endSquareNb: number) => {
            this.createMove(moves, startSquareNb, endSquareNb, board, opponentAttackTable, Pawn.LETTER, (endBoard) => {
                endBoard.squares[endSquareNb!] = new Queen(this.color)
            })
        }

        // Promotion
        if (
            moveOneSquareForward !== null &&
            board.squares[moveOneSquareForward] === null &&
            startRank === promotionStartRank
        ) {
            createPromotionMove(moveOneSquareForward)
        }

        // Basic captures
        for (let offset of this.captureOffsets) {
            const endSquareNb = this.addOffset(startSquareNb, offset)

            if (
                endSquareNb !== null &&
                board.squares[endSquareNb] &&
                board.squares[endSquareNb]!.color !== this.color
            ) {
                if (startRank === promotionStartRank) {
                    createPromotionMove(endSquareNb)
                } else {
                    this.createMove(moves, startSquareNb, endSquareNb, board, opponentAttackTable, Pawn.LETTER)
                }
            }
        }

        // En passant captures
        if (board.enPassantTargetSquareNb !== null) {
            const enPassantTargetSquareNb = board.enPassantTargetSquareNb
            const offsetToTarget = enPassantTargetSquareNb - startSquareNb
            if (offsetToTarget === 7 * this.direction || offsetToTarget === 9 * this.direction) {
                this.createMove(
                    moves,
                    startSquareNb,
                    enPassantTargetSquareNb,
                    board,
                    opponentAttackTable,
                    Pawn.LETTER,
                    (endBoard) => {
                        endBoard.squares[enPassantTargetSquareNb - 8 * this.direction] = null
                    }
                )
            }
        }

        return moves
    }

    updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void {
        this.calculateAttackTable(startSquareNb, board, table, this.captureOffsets, false)
    }

    get isSliding(): boolean {
        return false
    }

    private get direction(): number {
        return this.color === 'white' ? 1 : -1
    }

    private get captureOffsets(): FileRank[] {
        return [
            { file: -1, rank: this.direction },
            { file: 1, rank: this.direction },
        ]
    }
}
