import { Board } from '../board'
import { Move } from '../move'
import { fileRank, AttackTable, PieceColor, PieceLetter, PossibleMoveOptions } from '../types'
import { invertColor } from '../utils'
import { Piece } from './piece'

export class King extends Piece {
    private static LETTER: PieceLetter = 'K'

    constructor(color: PieceColor) {
        super('king', color)
    }

    possibleMoves(
        startSquareNb: number,
        board: Board,
        opponentAttackTable: AttackTable,
        options: PossibleMoveOptions
    ): Move[] {
        const moves: Move[] = []

        for (let offset of OFFSETS) {
            const endSquareNb = this.addOffset(startSquareNb, offset)
            this.createMove(moves, startSquareNb, endSquareNb, board, King.LETTER, options, (endBoard) => {
                const canCastle = endBoard.canCastle[this.color]
                canCastle.queenSide = false
                canCastle.kingSide = false
            })
        }

        // Castling
        if (!options.skipCheckVerification) {
            // Castlings cannot "eat" opponent kings
            const canCastle = board.canCastle[this.color]
            if (canCastle.queenSide) {
                const isClearPath = this.areSquaresClear(board, startSquareNb, [
                    startSquareNb - 1,
                    startSquareNb - 2,
                    startSquareNb - 3,
                ])
                if (isClearPath) {
                    const move = this.createCastling(board, startSquareNb, true)
                    moves.push(move)
                }
            }
            if (canCastle.kingSide) {
                const isClearPath = this.areSquaresClear(board, startSquareNb, [startSquareNb + 1, startSquareNb + 2])
                if (isClearPath) {
                    const move = this.createCastling(board, startSquareNb, false)
                    moves.push(move)
                }
            }
        }

        return moves
    }

    private areSquaresClear(board: Board, startSquareNb: number, squareNbs: number[]): boolean {
        return (
            squareNbs.every((squareNb) => !board.squares[squareNb]) &&
            !board.areSquaresAttacked(invertColor(this.color), ...[startSquareNb, ...squareNbs])
        )
    }

    private createCastling(startBoard: Board, startSquareNb: number, isQueenSideCastling: boolean): Move {
        const endBoard = new Board(startBoard, { switchColor: true, resetEnPassant: true })
        endBoard.canCastle[this.color][isQueenSideCastling ? 'queenSide' : 'kingSide'] = false

        const rookStartPosition = startSquareNb + (isQueenSideCastling ? -4 : 3)
        const endSquareNb = startSquareNb + (isQueenSideCastling ? -2 : 2)

        endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb]
        endBoard.squares[endSquareNb + (isQueenSideCastling ? 1 : -1)] = endBoard.squares[rookStartPosition]
        endBoard.squares[startSquareNb] = null
        endBoard.squares[rookStartPosition] = null

        const moveNotation = isQueenSideCastling ? 'O-O-O' : 'O-O'
        return new Move(startBoard.squares[startSquareNb]!, startSquareNb, endSquareNb, endBoard, moveNotation)
    }

    updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void {
        this.calculateAttackTable(startSquareNb, board, table, OFFSETS, false)
    }
}

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
