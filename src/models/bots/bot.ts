import { BestMove } from '../bestMove';
import { Board } from '../board'

export abstract class Bot {
    constructor(public board: Board, public depth: number | null) {}

    abstract run(): BestMove | null
}
