import { drawBoard } from './draw'
import { Game } from './models/game'

export class Chess {
    private game: Game = new Game()
    private selectedSquareNb: number | null = 11
    //public mode: "1v1" | "1vC" | "CvC"

    draw() {
        const board = this.game.currentBoard
        drawBoard(board, this.selectedSquareNb)
    }
}
