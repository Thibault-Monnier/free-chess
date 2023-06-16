import { drawBoard, squareSize } from './draw'
import { Game } from './models/game'

export class Chess {
    private game: Game = new Game()
    private selectedSquareNb: number | null = null
    //public mode: "1v1" | "1vC" | "CvC"

    draw() {
        const board = this.game.currentBoard
        drawBoard(board, this.selectedSquareNb)
    }

    clickedSquare(x: number, y: number) {
        const squareNb =
            Math.floor(x / squareSize) +
            Math.floor((squareSize * 8 - (y + 1)) / squareSize) * 8

        if (this.game.currentBoard.squares[squareNb] !== null) {
            this.selectedSquareNb = squareNb
            this.draw()
        }
    }
}
