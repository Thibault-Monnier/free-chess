import { drawArrow, imagesLoading, piecesImages } from './draw'
import { Board } from './models/board'
import { Move } from './models/move'
import { squareNbToFileRank } from './models/utils'
import { waitOneMillisecondAsync } from './utils'

export class Canvas {
    public readonly canvasDOM = document.getElementById('board') as HTMLCanvasElement
    private readonly ctx = this.canvasDOM.getContext('2d') as CanvasRenderingContext2D

    private squareSize = 0

    draw(board: Board, selectedSquareNb: number | null, highlightedSquareNbs: boolean[], bestMove: Move | null): void {
        this.recalculateSquareSize()

        this.canvasDOM.width = this.squareSize * 8
        this.canvasDOM.height = this.squareSize * 8

        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const { x, y } = this.squareNbToXY(squareNb)
            this.ctx.fillStyle = this.getSquareColor(squareNb) === 'dark' ? darkSquares : lightSquares
            this.ctx.fillRect(x, y, this.squareSize, this.squareSize)

            if (selectedSquareNb === squareNb) {
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'
                this.ctx.fillRect(x, y, this.squareSize, this.squareSize)
            }
            if (highlightedSquareNbs[squareNb]) {
                this.ctx.fillStyle = 'rgba(255, 80, 70, 0.75)'
                this.ctx.fillRect(x, y, this.squareSize, this.squareSize)
            }
            if (bestMove?.startSquareNb === squareNb || bestMove?.endSquareNb === squareNb) {
                this.ctx.fillStyle = 'rgba(100, 255, 100, 0.75)'
                this.ctx.fillRect(x, y, this.squareSize, this.squareSize)
            }
        }
        this.drawCoordinates()
        if (bestMove) this.createBestMoveArrow(bestMove)
        this.drawPieces(board)
        if (selectedSquareNb !== null) this.drawPossibleMoves(board, selectedSquareNb)
    }

    setup() {
        this.canvasDOM.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())
    }

    private drawPossibleMoves(board: Board, selectedSquareNb: number) {
        const piece = board.squares[selectedSquareNb]!
        const moves = piece.possibleMoves(selectedSquareNb, board, board.createOpponentAttackTable())

        for (let move of moves) {
            const { x, y } = this.squareNbToXY(move.endSquareNb)
            const isOccupied = board.squares[move.endSquareNb] !== null

            this.ctx.beginPath()
            this.ctx.arc(
                x + this.squareSize / 2,
                y + this.squareSize / 2,
                isOccupied ? this.squareSize / 2 : this.squareSize / 8,
                0,
                Math.PI * 2
            )
            this.ctx.fillStyle = isOccupied ? 'rgba(30, 0, 100, 0.25)' : 'rgba(0, 0, 0, 0.2)'
            this.ctx.fill()
        }
    }

    private squareNbToXY(squareNb: number): { x: number; y: number } {
        return {
            x: this.squareSize * (squareNb % 8),
            y: this.canvasDOM.height - this.squareSize - this.squareSize * Math.floor(squareNb / 8),
        }
    }

    private getSquareColor(squareNb: number) {
        return ((squareNb >> 3) + squareNb) % 2 === 0 ? 'dark' : 'light'
    }

    squareNbFromMouseEvent(event: MouseEvent): number | null {
        const x = event.clientX - this.canvasDOM.getBoundingClientRect().x - this.canvasDOM.clientLeft
        const y = event.clientY - this.canvasDOM.getBoundingClientRect().y - this.canvasDOM.clientTop
        if (x < 0 || y < 0 || x >= this.canvasDOM.width || y >= this.canvasDOM.height) return null

        return Math.floor(x / this.squareSize) + Math.floor((this.squareSize * 8 - (y + 1)) / this.squareSize) * 8
    }

    private drawCoordinates() {
        const fontSize = 14
        this.ctx.font = `${fontSize}px Arial`

        for (let file = 0; file < 8; file++) {
            this.ctx.fillStyle = this.getSquareColor(file) === 'dark' ? lightSquares : darkSquares
            this.ctx.fillText(
                String.fromCharCode(97 + file),
                this.squareSize * (file + 1) - fontSize,
                this.canvasDOM.height - fontSize * 0.4
            )
        }

        for (let rank = 0; rank < 8; rank++) {
            this.ctx.fillStyle = this.getSquareColor(rank * 8) === 'dark' ? lightSquares : darkSquares
            this.ctx.fillText(String(rank + 1), fontSize * 0.4, this.squareSize * (7 - rank) + fontSize * 1.2)
        }
    }

    private createBestMoveArrow(move: Move): void {
        const startPosition = squareNbToFileRank(move.startSquareNb)
        const endPosition = squareNbToFileRank(move.endSquareNb)
        const width = 8
        const color = 'rgba(50, 150, 50, 1)'

        const startCoordinates = {
            fromX: startPosition.file * this.squareSize + this.squareSize / 2,
            fromY: (7 - startPosition.rank) * this.squareSize + this.squareSize / 2,
        }
        const endCoordinates = {
            toX: endPosition.file * this.squareSize + this.squareSize / 2,
            toY: (7 - endPosition.rank) * this.squareSize + this.squareSize / 2,
        }

        drawArrow(startCoordinates, endCoordinates, width, color, this.ctx)
    }

    private async drawPieces(board: Board) {
        while (imagesLoading > 0) {
            await waitOneMillisecondAsync()
        }

        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const piece = board.squares[squareNb]
            if (!piece) continue
            const { x, y } = this.squareNbToXY(squareNb)

            const image = piecesImages[piece.color][piece.name]
            const offset = (this.squareSize - this.pieceSize) / 2
            this.ctx.drawImage(image, x + offset, y + offset, this.pieceSize, this.pieceSize)
        }
    }

    private get pieceSize() {
        return this.squareSize * 0.97
    }

    private recalculateSquareSize() {
        this.squareSize = Math.floor(
            Math.min(
                document.getElementById('board_container')!.clientWidth,
                document.getElementById('board_container')!.clientHeight
            ) / 8
        )
    }
}

const lightSquares = '#efdfc5'
const darkSquares = '#ae7c66'
