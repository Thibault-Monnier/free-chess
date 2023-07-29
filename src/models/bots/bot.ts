import { Board } from '../board'
import { BestMove } from '../types'

export abstract class Bot {
    constructor(public board: Board, public depth: number | null) {}

    abstract run(): BestMove | null
}
