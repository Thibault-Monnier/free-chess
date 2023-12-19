import { Board } from '../board'
import { Move } from '../move'
import { FileRank, AttackTable, PieceColor, PieceLetter } from '../types'
import { Piece } from './piece'

export class King extends Piece {
    get notationChar(): PieceLetter {
        return 'K'
    }

    constructor(color: PieceColor) {
        super('king', color)
    }

    possibleMoves(startSquareNb: number, board: Board, opponentAttackTable: AttackTable): Move[] {
        const moves: Move[] = []

        for (let offset of OFFSETS) {
            const endSquareNb = this.addOffset(startSquareNb, offset)
            this.createMove(
                moves,
                startSquareNb,
                endSquareNb,
                board,
                opponentAttackTable,
                this.notationChar,
                (endBoard) => {
                    const canCastle = endBoard.canCastle[this.color]
                    canCastle.queenSide = false
                    canCastle.kingSide = false
                }
            )
        }

        // Castling
        const canCastle = board.canCastle[this.color]
        if (canCastle.queenSide) {
            const isClearPath = this.areSquaresClear(board, opponentAttackTable, startSquareNb, [
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
            const isClearPath = this.areSquaresClear(board, opponentAttackTable, startSquareNb, [
                startSquareNb + 1,
                startSquareNb + 2,
            ])
            if (isClearPath) {
                const move = this.createCastling(board, startSquareNb, false)
                moves.push(move)
            }
        }

        return moves
    }

    private areSquaresClear(
        board: Board,
        opponentAttackTable: AttackTable,
        startSquareNb: number,
        squareNbs: number[]
    ): boolean {
        return (
            squareNbs.every((squareNb) => !board.squares[squareNb]) &&
            [startSquareNb, ...squareNbs].every((squareNb) => !opponentAttackTable.attackedSquares[squareNb])
        )
    }

    private createCastling(startBoard: Board, startSquareNb: number, isLongCastle: boolean): Move {
        const endBoard = new Board(startBoard, { switchColor: true, resetEnPassant: true })
        endBoard.canCastle[this.color][isLongCastle ? 'queenSide' : 'kingSide'] = false

        const rookStartPosition = startSquareNb + (isLongCastle ? -4 : 3)
        const endSquareNb = startSquareNb + (isLongCastle ? -2 : 2)

        endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb]
        endBoard.squares[endSquareNb + (isLongCastle ? 1 : -1)] = endBoard.squares[rookStartPosition]
        endBoard.squares[startSquareNb] = null
        endBoard.squares[rookStartPosition] = null

        const moveNotation = isLongCastle ? 'O-O-O' : 'O-O'
        return new Move(
            startBoard.squares[startSquareNb]!,
            startSquareNb,
            endSquareNb,
            endBoard,
            isLongCastle ? 'longCastle' : 'shortCastle'
        )
    }

    updateAttackTable(startSquareNb: number, board: Board, table: AttackTable): void {
        this.calculateAttackTable(startSquareNb, board, table, OFFSETS, false)
    }

    get isSliding(): boolean {
        return false
    }
}

const OFFSETS: FileRank[] = [
    { file: 1, rank: 1 },
    { file: 1, rank: 0 },
    { file: 1, rank: -1 },
    { file: 0, rank: 1 },
    { file: 0, rank: -1 },
    { file: -1, rank: 1 },
    { file: -1, rank: 0 },
    { file: -1, rank: -1 },
]
