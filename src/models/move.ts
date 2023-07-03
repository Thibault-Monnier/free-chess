import { Board } from './board'
import { Piece } from './pieces/piece';

export class Move {
    constructor(
        public piece: Piece,
        public startSquareNb: number,
        public endSquareNb: number,
        public endBoard: Board,
        public notation: string
    ) {}
}


