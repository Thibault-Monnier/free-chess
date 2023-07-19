import { drawBoard, squareSize } from './draw'
import { Game } from './models/game'
import { Move } from './models/move'

export class Chess {
    private game: Game = new Game()
    private selectedSquareNb: number | null = null
    private highlightedSquareNbs: boolean[] = new Array(64).fill(false)
    //public mode: "1v1" | "1vC" | "CvC"

    constructor() {
        this.draw()
    }

    private draw() {
        this.toggleActions()
        drawBoard(this.game, this.selectedSquareNb, this.highlightedSquareNbs)
        this.updateMovesPanel()
        this.toggleNextPlayer()
        this.alertEndOfGame()
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
                this.selectedSquareNb = null
            }
            //Deselects the square if it is empty
            else if (piece === null) {
                this.selectedSquareNb = null
            }
            //Selects the square if it contains a piece of the current player
            else if (piece.color === this.game.currentBoard.colorToMove) {
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
        const possibleMoves = piece!.possibleMoves(this.selectedSquareNb, this.game.currentBoard, {})
        return possibleMoves.find((move) => move.endSquareNb === endSquareNb)
    }

    private alertEndOfGame() {
        const currentBoard = this.game.currentBoard
        if (currentBoard.possibleMoves().length === 0) {
            if (currentBoard.isInCheck()) alert('Checkmate!')
            else alert('Stalemate!')
        }
    }

    private toggleNextPlayer() {
        const isWhite = this.game.currentBoard.colorToMove === 'white'
        document.getElementById('white_to_move')!.setAttribute('style', isWhite ? '' : 'display: none;')
        document.getElementById('black_to_move')!.setAttribute('style', isWhite ? 'display: none;' : '')
    }

    jumpToMove(moveNb: number): void {
        this.selectedSquareNb = null
        this.game.jumpToMove(moveNb)
        this.draw()
    }

    undo(): void {
        this.selectedSquareNb = null
        this.game.undo()
        this.draw()
    }

    redo(): void {
        this.selectedSquareNb = null
        this.game.redo()
        this.draw()
    }

    reset(): void {
        this.selectedSquareNb = null
        this.game = new Game()
        this.draw()
    }

    private toggleActions(): void {
        if (this.game.canUndo) document.getElementById('undo')!.removeAttribute('disabled')
        else document.getElementById('undo')!.setAttribute('disabled', '')

        if (this.game.canRedo) document.getElementById('redo')!.removeAttribute('disabled')
        else document.getElementById('redo')!.setAttribute('disabled', '')
    }

    private updateMovesPanel(): void {
        let html = ''
        const moves = document.getElementById('moves')!

        this.game.moves.forEach((move, index) => {
            if (index % 2 === 0) {
                html += `<div>${index / 2 + 1}.</div>`
            }

            html +=
                this.game.moveNb - 1 === index
                    ? `<div class="move currentMove">${move.notation}</div>`
                    : `<div class="move" onClick="window.chess.jumpToMove(${index + 1})">${move.notation}</div>`
        })
        moves.innerHTML = html

        const currentMove = document.getElementsByClassName('currentMove')[0]
        if (currentMove) currentMove.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
}
