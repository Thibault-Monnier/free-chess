import { Board } from '../board'

export abstract class Evaluator {
    constructor(public board: Board) {}

    abstract run(): number
}
