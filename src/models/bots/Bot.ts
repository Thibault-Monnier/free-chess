import { BestMove } from '../BestMove'
import { Board } from '../Board'

export abstract class Bot {
    constructor(public board: Board, public depth: number | null) {}

    abstract run(): BestMove | null
}
