import { Board } from '../board'
import { Move } from '../move'
import { OpponentAttackTable, PieceColor, PossibleMoveOptions, fileRank } from '../types'
import { Piece } from './piece'

export class Bishop extends Piece {
    constructor(color: PieceColor) {
        super('bishop', color)
    }

    possibleMoves(startSquareNb: number, board: Board, options: PossibleMoveOptions): Move[] {
        return this.createMovesForRepeatedOffsets(startSquareNb, offsets, board, 'B', options)
    }

    updateAttackTable(startSquareNb: number, board: Board, table: OpponentAttackTable): void {
        for (let offset of offsets) {
            let endSquareNb: number | null = startSquareNb

            while (true) {
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
            }
        }
    }

    isPiecePinned(startSquareNb: number, board: Board, offset: fileRank): boolean {
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
}

const offsets: fileRank[] = [
    { file: 1, rank: 1 },
    { file: 1, rank: -1 },
    { file: -1, rank: 1 },
    { file: -1, rank: -1 },
]
