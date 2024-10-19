import { cburnettPiecesImages, drawArrow, freeChessPiecesImages, imagesLoading } from './drawUtils'
import { Board } from './models/Board'
import { Move } from './models/Move'
import { squareNbToFileRank } from './models/utils'
import { waitOneMillisecondAsync } from './utils'

export class Canvas {
    readonly canvasDOM = document.getElementById('board') as HTMLCanvasElement
    private readonly ctx = this.canvasDOM.getContext('2d') as CanvasRenderingContext2D

    private squareSize = 0

    draw(
        board: Board,
        selectedSquareNb: number | null,
        highlightedSquareNbs: boolean[],
        lastMove: Move | undefined,
        bestMove: Move | null,
        possibleMoves: Move[] | undefined
    ): void {
        this.recalculateSquareSize()

        this.canvasDOM.width = document.getElementById('board')!.clientWidth * window.devicePixelRatio
        this.canvasDOM.height = document.getElementById('board')!.clientHeight * window.devicePixelRatio

        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const { x, y } = this.squareNbToXY(squareNb)

            const squareColor = this.getSquareColor(squareNb) === 'dark' ? darkSquares : lightSquares
            this.fillRect(x, y, this.squareSize, this.squareSize, squareColor)

            if (selectedSquareNb === squareNb) {
                this.fillRect(x, y, this.squareSize, this.squareSize, 'rgba(255, 255, 0, 0.5)')
            }
            if (lastMove?.startSquareNb === squareNb || lastMove?.endSquareNb === squareNb) {
                this.fillRect(x, y, this.squareSize, this.squareSize, 'rgba(150, 150, 50, 0.75)')
            }
            if (bestMove?.startSquareNb === squareNb || bestMove?.endSquareNb === squareNb) {
                this.fillRect(x, y, this.squareSize, this.squareSize, 'rgba(100, 255, 100, 0.5)')
            }
            if (highlightedSquareNbs[squareNb]) {
                this.fillRect(x, y, this.squareSize, this.squareSize, 'rgba(255, 80, 70,0.75)')
            }
        }

        this.drawCoordinates()
        if (bestMove) this.createBestMoveArrow(bestMove)
        this.drawPieces(board)
        if (possibleMoves) this.drawPossibleMoves(board, possibleMoves)
    }

    private fillRect(x: number, y: number, width: number, height: number, color: string) {
        this.ctx.fillStyle = color
        this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(width), Math.ceil(height))
    }

    setup() {
        this.canvasDOM.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())
    }

    private drawPossibleMoves(board: Board, possibleMoves: Move[]) {
        for (let move of possibleMoves) {
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
        const cssSquareSize = this.squareSize / window.devicePixelRatio

        const cssX = event.clientX - this.canvasDOM.getBoundingClientRect().x - this.canvasDOM.clientLeft
        const cssY = event.clientY - this.canvasDOM.getBoundingClientRect().y - this.canvasDOM.clientTop
        if (
            cssX < 0 ||
            cssY < 0 ||
            cssX * devicePixelRatio >= this.canvasDOM.width /* canvasDOM.width is in js width, but cssX isn't */ ||
            cssY * devicePixelRatio >= this.canvasDOM.height /* canvasDOM.height is in js width, but cssY isn't */
        )
            return null

        return Math.floor(cssX / cssSquareSize) + Math.floor((cssSquareSize * 8 - (cssY + 1)) / cssSquareSize) * 8
    }

    private drawCoordinates() {
        const fontSize = this.squareSize / 5
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
        const width = this.squareSize / 12
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

            const image = freeChessPiecesImages[piece.color][piece.name]
            const offset = (this.squareSize - this.pieceSize) / 2
            this.ctx.drawImage(image, x + offset, y + offset, this.pieceSize, this.pieceSize)
        }
    }

    private get pieceSize() {
        return this.squareSize * 0.97
    }

    private recalculateSquareSize() {
        this.squareSize =
            (Math.min(document.getElementById('board')!.clientWidth, document.getElementById('board')!.clientHeight) /
                8) *
            window.devicePixelRatio
    }
}

const lightSquares = '#e5d7bf'
const darkSquares = '#b88465'
