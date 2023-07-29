import { Board } from '../board'
import { Move } from '../move'

export abstract class Bot {
    constructor(public board: Board, public depth: number | null) {}

    abstract run(): { move: Move; evaluation: number } | null
}
