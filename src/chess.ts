import { drawBoard, squareSize } from './draw'
import { DepthNBot } from './models/bots/depthNBot'
import { Game } from './models/game'
import { Move } from './models/move'
import { BestMove } from './models/types'

export class Chess {
    private game: Game = new Game()
    private selectedSquareNb: number | null = null
    private highlightedSquareNbs: boolean[] = new Array(64).fill(false)
    private bestMove: BestMove | null = null
    //public mode: "1v1" | "1vC" | "CvC"

    constructor() {
        this.calculateBestMove()
        this.draw()
    }

    private draw() {
        this.toggleActions()
        drawBoard(
            this.game,
            this.selectedSquareNb,
            this.highlightedSquareNbs,
            this.bestMove ? this.bestMove.move : null
        )
        this.updateMovesPanel()
        this.toggleNextPlayer()
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
                this.calculateBestMove()
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

    private toggleNextPlayer() {
        const whiteToMoveElement = document.getElementById('white_to_move')!
        const blackToMoveElement = document.getElementById('black_to_move')!
        const endOfGameElement = document.getElementById('end_of_game')!

        whiteToMoveElement.setAttribute('style', 'display: none;')
        blackToMoveElement.setAttribute('style', 'display: none;')
        endOfGameElement.setAttribute('style', 'display: none;')

        const endOfGame = this.game.currentBoard.endOfGame
        switch (endOfGame) {
            case 'checkmate':
                const colorToMove = this.game.currentBoard.colorToMove
                endOfGameElement.innerHTML = `${
                    colorToMove.charAt(0).toUpperCase() + colorToMove.slice(1)
                } wins by checkmate!`
                endOfGameElement.setAttribute('style', '')
                break
            case 'stalemate':
                endOfGameElement.innerHTML = 'Stalemate!'
                endOfGameElement.setAttribute('style', '')
                break
            case null:
                const isWhite = this.game.currentBoard.colorToMove === 'white'
                if (isWhite) whiteToMoveElement.setAttribute('style', '')
                else blackToMoveElement.setAttribute('style', '')
        }
    }

    private updateEvaluation() {
        const element = document.getElementById('evaluation')!
        element.innerHTML = `Evaluation: ${this.bestMove ? this.bestMove.evaluation : '/'}`
    }

    private calculateBestMove(): void {
        const bot = new DepthNBot(this.game.currentBoard, 3)
        this.bestMove = bot.run()
        if (this.bestMove) this.updateEvaluation()
    }

    jumpToMove(moveNb: number): void {
        this.selectedSquareNb = null
        this.game.jumpToMove(moveNb)
        this.calculateBestMove()
        this.draw()
    }

    undo(): void {
        this.selectedSquareNb = null
        this.game.undo()
        this.calculateBestMove()
        this.draw()
    }

    redo(): void {
        this.selectedSquareNb = null
        this.game.redo()
        this.calculateBestMove()
        this.draw()
    }

    reset(): void {
        this.selectedSquareNb = null
        this.game = new Game()
        this.calculateBestMove()
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
