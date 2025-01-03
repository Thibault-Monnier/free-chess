import { BestMove } from '../BestMove'
import { Board } from '../Board'

export abstract class Bot {
    constructor(public board: Board, public depth: number) {}

    abstract run(): BestMove | null
}
