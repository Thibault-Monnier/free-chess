import { Board } from './Board'
import { SerializedBestMove, SerializedMove, SerializedPiece } from './serializedTypes'
import { Move } from './Move'
import { Bishop } from './pieces/Bishop'
import { King } from './pieces/King'
import { Knight } from './pieces/Knight'
import { Pawn } from './pieces/Pawn'
import { Piece } from './pieces/Piece'
import { Queen } from './pieces/Queen'
import { Rook } from './pieces/Rook'
import { BestMove } from './BestMove'

// NOTE: These functions cannot be in the same file as the classes they deserialize, because of circular dependencies

function deserializePiece({ name, color }: SerializedPiece): Piece {
    switch (name) {
        case 'bishop':
            return new Bishop(color)
        case 'king':
            return new King(color)
        case 'knight':
            return new Knight(color)
        case 'pawn':
            return new Pawn(color)
        case 'queen':
            return new Queen(color)
        case 'rook':
            return new Rook(color)
    }
}

function deserializeMove(serializedMove: SerializedMove): Move {
    return new Move(
        deserializePiece(serializedMove.pieceData),
        serializedMove.startSquareNb,
        serializedMove.endSquareNb,
        new Board(serializedMove.endBoardFEN),
        serializedMove.type
    )
}

export function deserializeBestMove({ move, evaluation }: SerializedBestMove): BestMove {
    return new BestMove(deserializeMove(move), evaluation)
}
