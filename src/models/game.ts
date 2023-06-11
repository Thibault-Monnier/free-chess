import { Board } from './board'
import { Move } from './move'

export class Game {
    public startingBoard: Board = new Board()
    public moves: Move[] = []

    get currentBoard(): Board {
        if (this.moves.length > 0) {
            return this.moves[this.moves.length - 1].endBoard
        } else {
            return this.startingBoard
        }
    }
}
