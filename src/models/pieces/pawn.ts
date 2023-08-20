import { Board } from '../board'
import { Move } from '../move'
import { FileRank, AttackTable, PieceColor, PieceLetter, PossibleMoveOptions } from '../types'
import { squareNbToFileRank } from '../utils'
import { Piece } from './piece'
import { Queen } from './queen'

export class Pawn extends Piece {
    private static LETTER: PieceLetter = ''

    constructor(color: PieceColor) {
        super('pawn', color)
    }

    possibleMoves(
        startSquareNb: number,
        board: Board,
        opponentAttackTable: AttackTable,
        options: PossibleMoveOptions
    ): Move[] {
        const moves: Move[] = []

        // Basic moves
        const moveOneSquare = startSquareNb + 8 * this.direction
        const moveTwoSquares = startSquareNb + 16 * this.direction
        const { rank: startRank } = squareNbToFileRank(startSquareNb)
        const promotionStartRank = this.color === 'white' ? 6 : 1

        if (!options.skipCheckVerification) {
            // Pawn advance cannot "eat" opponent kings
            if (moveOneSquare >= 0 && moveOneSquare <= 63 && board.squares[moveOneSquare] === null) {
                // Advance one square if not eligible for promotion
                if (startRank !== promotionStartRank) {
                    this.createMove(moves, startSquareNb, moveOneSquare, board, Pawn.LETTER, options)
                }

                // Advance two squares
                if (
                    board.squares[moveTwoSquares] === null &&
                    ((this.color === 'white' && startRank === 1) || (this.color === 'black' && startRank === 6))
                ) {
                    this.createMove(moves, startSquareNb, moveTwoSquares, board, Pawn.LETTER, options, (endBoard) => {
                        endBoard.enPassantTargetSquareNb = moveOneSquare
                    })
                }
            }
        }

        // Promotion
        if (board.squares[moveOneSquare] === null && startRank === promotionStartRank) {
            this.createMove(moves, startSquareNb, moveOneSquare, board, Pawn.LETTER, options, (endBoard) => {
                endBoard.squares[moveOneSquare] = new Queen(this.color)
            })
        }

        // Basic captures
        for (let offset of this.captureOffsets) {
            const endSquareNb = this.addOffset(startSquareNb, offset)

            if (
                endSquareNb !== null &&
                board.squares[endSquareNb] &&
                board.squares[endSquareNb]!.color !== this.color
            ) {
                this.createMove(moves, startSquareNb, endSquareNb, board, Pawn.LETTER, options)
            }
        }

        // En passant captures
        if (!options.skipCheckVerification) {
            // En passant captures cannot "eat" opponent kings
            if (board.enPassantTargetSquareNb !== null) {
                const enPassantTargetSquareNb = board.enPassantTargetSquareNb
                const offsetToTarget = enPassantTargetSquareNb - startSquareNb
                if (offsetToTarget === 7 * this.direction || offsetToTarget === 9 * this.direction) {
                    this.createMove(
                        moves,
                        startSquareNb,
                        enPassantTargetSquareNb,
                        board,
                        Pawn.LETTER,
                        options,
                        (endBoard) => {
                            endBoard.squares[enPassantTargetSquareNb - 8 * this.direction] = null
                        }
                    )
                }
            }
        }

        return moves
    }

    updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void {
        this.calculateAttackTable(startSquareNb, board, table, this.captureOffsets, false)
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
