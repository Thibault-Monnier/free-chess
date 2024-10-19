import { Board } from './Board'
import { SerializedMove } from './serializedTypes'
import { Piece } from './pieces/Piece'
import { MoveType } from './types'

export class Move {
    constructor(
        public piece: Piece,
        public startSquareNb: number,
        public endSquareNb: number,
        public endBoard: Board,
        public type: MoveType
    ) {}

    serialize(): SerializedMove {
        return {
            pieceData: this.piece.serialize(),
            startSquareNb: this.startSquareNb,
            endSquareNb: this.endSquareNb,
            endBoardFEN: this.endBoard.serialize(),
            type: this.type,
        }
    }
}
