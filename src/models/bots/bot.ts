import { Board } from '../board'
import { Move } from '../move'

export abstract class Bot {
    constructor(public board: Board) {}

    abstract run(): Move | null
}
