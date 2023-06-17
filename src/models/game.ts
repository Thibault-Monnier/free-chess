import { Board } from './board'
import { Move } from './move'

export class Game {
    public startingBoard: Board = new Board()
    private moves: Move[] = []
    private moveNb: number = 0

    get currentBoard(): Board {
        if (this.moveNb > 0) {
            return this.moves[this.moveNb - 1].endBoard
        } else {
            return this.startingBoard
        }
    }

    addMove(move: Move): void {
        this.moves.push(move)
        this.moveNb++
    }
}
