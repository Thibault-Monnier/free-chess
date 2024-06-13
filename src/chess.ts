import { Canvas } from './canvas'
import { Board } from './models/board'
import { DepthNBot } from './models/bots/depthNBot'
import { Game } from './models/game'
import { Move } from './models/move'
import { BestMove, PlayMode } from './models/types'
import { invertColor } from './models/utils'

export class Chess {
    private game = new Game()
    private canvas = new Canvas()
    private selectedSquareNb: number | null = null
    private highlightedSquareNbs = new Array(64).fill(false)
    private bestMove: BestMove | null | undefined
    private showBestMove = false
    private calculateBestMoveHandle: number | undefined

    constructor(private playMode: PlayMode = '1v1') {}

    private get currentBoard(): Board {
        return this.game.currentBoard
    }

    setup() {
        this.canvas.setup()

        if (this.playMode === '1v1') this.showBestMove = true

        this.toggleEvaluationDisplay(this.playMode !== '1vC')
        this.setActivePlayModeButton()
        this.newMove()
    }

    private draw() {
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

        this.updateMovesPanel()
        this.toggleActions()
        this.calculateBestMove()
        this.draw()
    }

    clicked(event: any) {
        if (event.type === 'click') {
            // Make sure the event is triggered on child elements of the buttons
            const targetButton = (event.target as HTMLElement).closest('button')
            const id = targetButton?.id
            if (id === 'undo') this.undo()
            if (id === 'redo') this.redo()
            if (id === 'reset') this.reset()
            if (id === 'copy_moves') {
                navigator.clipboard.writeText(
                    this.game.moves.map((_, move) => this.game.calculateMoveNotation(move)).join(' ')
                )
            }
        }

        if (event.type === 'mousedown') {
            const squareNb = this.canvas.squareNbFromMouseEvent(event)
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
            } else {
                const move = this.getMove(squareNb)
                if (this.selectedSquareNb !== null && move) {
                    // Makes a move if possible
                    this.game.addMove(move)
                    this.newMove()
                } else if (piece === null) {
                    // Deselects the square if it is empty
                    this.selectedSquareNb = null
                } else if (piece.color === this.currentBoard.colorToMove) {
                    // Selects the square if it contains a piece of the current player
                    this.selectedSquareNb = squareNb
                }
            }
        }

        if (clickType === 'right') {
            this.selectedSquareNb = null
            this.highlightedSquareNbs[squareNb] = !this.highlightedSquareNbs[squareNb]
        }

        this.draw()
    }

    private resetSelectedSquare() {
        this.selectedSquareNb = null
        this.draw()
    }

    // Calls the possibleMoves() method of the piece on the selected square, returns the move if it exists
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
        if (!(this.playMode === '1vC' && this.currentBoard.colorToMove === 'white')) {
            this.runBot(() => this.playBestMove())
        }
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

    private toggleEvaluationDisplay(visible: boolean) {
        document.getElementById('evaluation')!.style.display = visible ? 'flex' : 'none'
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

    private undo(): void {
        this.game.undo(this.playMode === '1vC' ? 2 : 1)
        this.newMove()
    }

    private redo(): void {
        this.game.redo()
        this.newMove()
    }

    private reset(): void {
        this.game = new Game()
        this.newMove()
    }

    private toggleActions(): void {
        const setButtonState = (button: HTMLElement, condition: boolean) => {
            if (condition) button.removeAttribute('disabled')
            else button.setAttribute('disabled', '')
        }

        setButtonState(document.getElementById('undo')!, this.game.canUndo)
        setButtonState(document.getElementById('redo')!, this.game.canRedo)
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
