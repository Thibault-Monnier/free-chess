import { Board } from './board'
import { Move } from './move'
import { PieceColor } from './types'

export class Game {
    private startingBoard: Board = new Board()
    private moves: Move[] = []
    private moveNb: number = 0

    get currentBoard(): Board {
        if (this.moveNb > 0) {
            return this.moves[this.moveNb - 1].endBoard
        } else {
            return this.startingBoard
        }
    }

    get currentPlayerColor(): PieceColor {
        return this.moveNb % 2 === 0 ? 'white' : 'black'
    }

    get lastMove(): Move | undefined {
        return this.moves[this.moveNb - 1]
    }

    addMove(move: Move): void {
        this.moves = this.moves.slice(0, this.moveNb)
        this.moves.push(move)
        this.moveNb++
    }

    get canUndo(): boolean {
        return this.moveNb > 0
    }

    undo(): void {
        if (this.canUndo) this.moveNb--
    }

    get canRedo(): boolean {
        return this.moveNb < this.moves.length
    }

    redo(): void {
        if (this.canRedo) this.moveNb++
    }
}
