import { Move } from './Move'
import { SerializedBestMove } from './serializedTypes'

export class BestMove {
    constructor(public move: Move, public evaluation: number) {}

    serialize(): SerializedBestMove {
        return { move: this.move.serialize(), evaluation: this.evaluation }
    }
}
