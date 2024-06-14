import { MoveType, PieceColor, PieceName } from './types'

export type SerializedPiece = {
    name: PieceName
    color: PieceColor
}

export type SerializedMove = {
    pieceData: SerializedPiece
    startSquareNb: number
    endSquareNb: number
    endBoardFEN: string
    type: MoveType
}

export type SerializedBestMove = {
    move: SerializedMove
    evaluation: number
}
