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

            const piece = this.game.currentBoard.squares[squareNb]
            //Deselects the square if it was already selected
            if (squareNb === this.selectedSquareNb) {
                this.selectedSquareNb = null
            }
            //Makes a move if possible
            else if (this.selectedSquareNb !== null && this.getMove(squareNb)) {
                const move = this.getMove(squareNb)!
                this.game.addMove(move)
                this.game.lastMove = move
                console.log('lastMove: ' + move.endSquareNb)
                this.toggleNextPlayer()
                this.selectedSquareNb = null
            }
            //Deselects the square if it is empty
            else if (piece === null) {
                this.selectedSquareNb = null
            }
            //Selects the square if it contains a piece of the current player
            else if (piece.color === this.game.currentPlayerColor) {
                this.selectedSquareNb = squareNb
            }
        } else {
            this.selectedSquareNb = null
            this.highlightedSquareNbs[squareNb] = !this.highlightedSquareNbs[squareNb]
        }

        this.draw()
    }

    //Calls the possibleMoves() method of the piece on the selected square
    private getMove(endSquareNb: number): Move | undefined {
        if (this.selectedSquareNb === null) return
        const piece = this.game.currentBoard.squares[this.selectedSquareNb]
        const possibleMoves = piece!.possibleMoves(this.selectedSquareNb, this.game)
        return possibleMoves.find((move) => move.endSquareNb === endSquareNb)
    }

    private toggleNextPlayer() {
        const isWhite = this.game.currentPlayerColor === 'white'
        document.getElementById('white_to_move')!.setAttribute('style', isWhite ? '' : 'display: none;')
        document.getElementById('black_to_move')!.setAttribute('style', isWhite ? 'display: none;' : '')
    }
}
