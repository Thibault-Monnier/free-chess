import { Canvas } from './canvas'
import { Board } from './models/board'
import { DepthNBot } from './models/bots/depthNBot'
import { Game } from './models/game'
import { Move } from './models/move'
import { BestMove, PlayMode } from './models/types'
import { invertColor } from './models/utils'

export class Chess {
    private game = new Game()
    private playMode: PlayMode
    private selectedSquareNb: number | null = null
    private highlightedSquareNbs = new Array(64).fill(false)
    private bestMove: BestMove | null | undefined
    private showBestMove = false
    private calculateBestMoveHandle: number | undefined
    private canvas = new Canvas()

    constructor(playMode: PlayMode = '1v1') {
        this.playMode = playMode
    }

    private get currentBoard(): Board {
        return this.game.currentBoard
    }

    setup() {
        this.canvas.setup()

        if (this.playMode === '1v1') this.showBestMove = true
        if (this.playMode === '1vC') this.hideEvaluation()
        else this.showEvaluation()

        this.setActivePlayModeButton()
        this.newMove()
    }

    private draw() {
        this.toggleActions()
        this.updateMovesPanel()
        this.toggleNextPlayer()
        this.updateEvaluation()
        this.drawCanvas()
    }

    private drawCanvas() {
        this.canvas.draw(
            this.currentBoard,
            this.selectedSquareNb,
            this.highlightedSquareNbs,
            this.game.lastMove,
            this.bestMove && this.showBestMove ? this.bestMove.move : null
        )
    }

    private newMove() {
        this.resetSelectedSquare()
        this.highlightedSquareNbs.fill(false)
        this.calculateBestMove()
        this.draw()
    }

    clicked(event: any) {
        if (event.target === document.getElementById('undo')) this.undo()
        if (event.target === document.getElementById('redo')) this.redo()
        if (event.target === document.getElementById('reset')) this.reset()

        const squareNb = this.canvas.squareNbFromMouseEvent(event)
        if (event.type === 'mousedown') {
            if (squareNb !== null) {
                this.clickedSquare(squareNb, event.button === 0 ? 'left' : 'right')
            } else {
                this.clickedOutside()
            }
        }
    }

    keydown(event: KeyboardEvent) {
        if (event.key === 'ArrowLeft') this.undo()
        if (event.key === 'ArrowRight') this.redo()
    }

    windowResize() {
        this.drawCanvas()
    }

    private clickedOutside() {
        this.resetSelectedSquare()
    }

    private clickedSquare(squareNb: number, clickType: 'left' | 'right') {
        if (clickType === 'left') {
            const piece = this.currentBoard.squares[squareNb]

            this.highlightedSquareNbs.fill(false)
            if (squareNb === this.selectedSquareNb) {
                // Deselects the square if it was already selected
                this.selectedSquareNb = null
            } else if (this.selectedSquareNb !== null && this.getMove(squareNb)) {
                // Makes a move if possible
                const move = this.getMove(squareNb)!
                this.game.addMove(move)
                this.newMove()
            } else if (piece === null) {
                // Deselects the square if it is empty
                this.selectedSquareNb = null
            } else if (piece.color === this.currentBoard.colorToMove) {
                // Selects the square if it contains a piece of the current player
                this.selectedSquareNb = squareNb
            }
        } else {
            this.selectedSquareNb = null
            this.highlightedSquareNbs[squareNb] = !this.highlightedSquareNbs[squareNb]
        }

        this.draw()
    }

    private resetSelectedSquare() {
        this.selectedSquareNb = null
        this.draw()
    }

    //Calls the possibleMoves() method of the piece on the selected square
    private getMove(endSquareNb: number): Move | undefined {
        if (this.selectedSquareNb === null) return
        const piece = this.currentBoard.squares[this.selectedSquareNb]
        const possibleMoves = piece!.possibleMoves(
            this.selectedSquareNb,
            this.currentBoard,
            this.currentBoard.createOpponentAttackTable()
        )
        return possibleMoves.find((move) => move.endSquareNb === endSquareNb)
    }

    private toggleNextPlayer() {
        const whiteToMoveElement = document.getElementById('white_to_move')!
        const blackToMoveElement = document.getElementById('black_to_move')!
        const endOfGameElement = document.getElementById('end_of_game')!
        const endOfGameText = document.getElementById('end_of_game_text')!

        whiteToMoveElement.setAttribute('style', 'display: none;')
        blackToMoveElement.setAttribute('style', 'display: none;')
        endOfGameElement.setAttribute('style', 'display: none;')

        const endOfGame = this.currentBoard.endOfGame
        switch (endOfGame) {
            case 'checkmate':
                const colorWinner = invertColor(this.currentBoard.colorToMove)
                endOfGameText.innerText = `${
                    colorWinner.charAt(0).toUpperCase() + colorWinner.slice(1)
                } wins by checkmate!`
                endOfGameElement.setAttribute('style', '')
                break
            case 'stalemate':
                endOfGameText.innerText = 'Stalemate!'
                endOfGameElement.setAttribute('style', '')
                break
            case null:
                const isWhite = this.currentBoard.colorToMove === 'white'
                if (isWhite) whiteToMoveElement.setAttribute('style', '')
                else blackToMoveElement.setAttribute('style', '')
        }
    }

    private calculateBestMove(): void {
        this.stopBot()
        this.runBot(() => this.playBestMove())
    }

    private updateEvaluation() {
        const element = document.getElementById('evaluation')!
        switch (this.bestMove) {
            case undefined:
                element.innerHTML = '. . .'
                break
            case null:
                element.innerHTML = 'Evaluation: /'
                break
            default:
                element.innerHTML = `Evaluation: ${this.bestMove.evaluation}`
        }
    }

    private showEvaluation() {
        const element = document.getElementById('evaluation')
        if (element) element?.setAttribute('style', 'display: flex;')
    }

    private hideEvaluation() {
        const element = document.getElementById('evaluation')
        if (element) element.setAttribute('style', 'display: none;')
    }

    private playBestMove() {
        if (this.playMode === 'CvC' || (this.playMode === '1vC' && this.currentBoard.colorToMove === 'black')) {
            if (this.bestMove) {
                this.game.addMove(this.bestMove.move)
                this.newMove()
            }
        }

        this.draw()
    }

    stopBot(): void {
        if (this.calculateBestMoveHandle !== undefined) cancelIdleCallback(this.calculateBestMoveHandle)
    }

    private runBot(after: () => void): void {
        this.bestMove = undefined
        this.calculateBestMoveHandle = requestIdleCallback((deadline) => {
            const bot = new DepthNBot(this.currentBoard, 4)
            this.bestMove = bot.run()
            after()
        })
    }

    jumpToMove(moveNb: number): void {
        this.game.jumpToMove(moveNb)
        this.newMove()
    }

    undo(): void {
        this.game.undo()
        this.newMove()
    }

    redo(): void {
        this.game.redo()
        this.newMove()
    }

    reset(): void {
        this.game = new Game()
        this.newMove()
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

        this.game.moves.forEach((_, index) => {
            // Add the move number every two moves
            if (index % 2 === 0) {
                html += `<div>${index / 2 + 1}.</div>`
                // The move number starts at one but the index starts at zero, so + 1 is required to adjust.
            }

            html +=
                this.game.moveNb - 1 === index
                    ? `<div class="move currentMove">${this.game.calculateMoveNotation(index)}</div>`
                    : `<div class="move" onMouseDown="window.chess.jumpToMove(${
                          index + 1
                      })">${this.game.calculateMoveNotation(index)}</div>`
        })
        moves.innerHTML = html

        const currentMove = document.getElementsByClassName('currentMove')[0]
        if (currentMove) {
            if (window.matchMedia('(min-width: 50rem)').matches) {
                currentMove.scrollIntoView({ behavior: 'smooth', block: 'center' })
            } else {
                moves.scrollTop = moves.scrollHeight
            }
        }
    }

    private setActivePlayModeButton() {
        const toggleVisibility = (id: string, visibility: boolean) => {
            document.getElementById(id)!.style.visibility = visibility ? 'visible' : 'hidden'
        }

        toggleVisibility('player_vs_player_arrow', this.playMode === '1v1')
        toggleVisibility('player_vs_bot_arrow', this.playMode === '1vC')
        toggleVisibility('bot_vs_bot_arrow', this.playMode === 'CvC')
    }
}
