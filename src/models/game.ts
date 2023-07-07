import { Board } from './board'
import { Move } from './move'
import { PieceColor } from './types'

export class Game {
    private startingBoard: Board = new Board()
    private _moves: Move[] = []
    private _moveNb: number = 0

    get moves(): Move[] {
        return this._moves
    }

    get moveNb(): number {
        return this._moveNb
    }

    get currentBoard(): Board {
        if (this._moveNb > 0) {
            return this._moves[this._moveNb - 1].endBoard
        } else {
            return this.startingBoard
        }
    }

    get currentPlayerColor(): PieceColor {
        return this._moveNb % 2 === 0 ? 'white' : 'black'
    }

    get lastMove(): Move | undefined {
        return this._moves[this._moveNb - 1]
    }

    addMove(move: Move): void {
        this._moves = this._moves.slice(0, this._moveNb)
        this._moves.push(move)
        this._moveNb++
    }

    jumpToMove(moveNb: number) {
        this._moveNb = moveNb
    }

    get canUndo(): boolean {
        return this._moveNb > 0
    }

    undo(): void {
        if (this.canUndo) this._moveNb--
    }

    get canRedo(): boolean {
        return this._moveNb < this._moves.length
    }

    redo(): void {
        if (this.canRedo) this._moveNb++
    }
}
