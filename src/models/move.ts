import { Board } from './board'
import { Piece } from './utils'

export class Move {
    constructor(
        public piece: Piece,
        public startPosition: number,
        public endBoard: Board,
        public notation: string
    ) {}
}


