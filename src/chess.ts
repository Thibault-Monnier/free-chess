import { drawBoard, squareSize } from './draw'
import { Game } from './models/game'
import { Move } from './models/move'

export class Chess {
    private game: Game = new Game()
    private selectedSquareNb: number | null = null
    private highlightedSquareNbs: boolean[] = new Array(64).fill(false)
    //public mode: "1v1" | "1vC" | "CvC"

    draw() {
        drawBoard(this.game, this.selectedSquareNb, this.highlightedSquareNbs)
    }

    clickedSquare(x: number, y: number, clickType: 'left' | 'right') {
        const squareNb = Math.floor(x / squareSize) + Math.floor((squareSize * 8 - (y + 1)) / squareSize) * 8

        if (clickType === 'left') {
            this.highlightedSquareNbs.fill(false)

            if (squareNb === this.selectedSquareNb) {
                this.selectedSquareNb = null
            } else if (this.selectedSquareNb !== null && this.getMove(squareNb)) {
                this.game.addMove(this.getMove(squareNb)!)
                this.selectedSquareNb = null
            } else if (this.game.currentBoard.squares[squareNb] === null) {
                this.selectedSquareNb = null
            } else {
                this.selectedSquareNb = squareNb
            }
        } else {
            this.selectedSquareNb = null
            this.highlightedSquareNbs[squareNb] = !this.highlightedSquareNbs[squareNb]
        }

        this.draw()
    }

    private getMove(endSquareNb: number): Move | undefined {
        if (this.selectedSquareNb === null) return
        const piece = this.game.currentBoard.squares[this.selectedSquareNb]
        const possibleMoves = piece!.possibleMoves(this.selectedSquareNb, this.game)
        return possibleMoves.find((move) => move.endSquareNb === endSquareNb)
    }
}
