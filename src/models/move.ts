import { Board } from './board'
import { Piece } from './pieces/piece';
import { MoveType } from './types';

export class Move {
    constructor(
        public piece: Piece,
        public startSquareNb: number,
        public endSquareNb: number,
        public endBoard: Board,
        public notation: string,
        public type: MoveType
    ) {}
}


