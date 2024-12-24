import { cburnettPiecesImages, drawArrow, freeChessPiecesImages, imagesLoading } from './drawUtils'
import { Board } from './models/Board'
import { Move } from './models/Move'
import { PieceColor } from './models/types'
import { squareNbToFileRank } from './models/utils'
import { waitOneMillisecondAsync } from './utils'

export class Canvas {
    readonly canvasDOM = document.getElementById('board') as HTMLCanvasElement
    private readonly ctx = this.canvasDOM.getContext('2d') as CanvasRenderingContext2D

    private bottomPlayerColor: PieceColor

    private squareSize = 0

    constructor(bottomPlayerColor: PieceColor) {
        this.bottomPlayerColor = bottomPlayerColor
    }

    private squareNbToDisplaySquareNb(squareNb: number): number {
        return this.bottomPlayerColor === 'white' ? squareNb : 63 - squareNb
    }

    private displaySquareNbToSquareNb(displaySquareNb: number): number {
        return this.bottomPlayerColor === 'white' ? displaySquareNb : 63 - displaySquareNb
    }

    private fileToDisplayFile(file: number): number {
        return this.bottomPlayerColor === 'white' ? file : 7 - file
    }

    private rankToDisplayRank(rank: number): number {
        return this.bottomPlayerColor === 'white' ? rank : 7 - rank
    }

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
                this.fillRect(x, y, this.squareSize, this.squareSize, moveSquareColor)
            }
            if (lastMove?.startSquareNb === squareNb || lastMove?.endSquareNb === squareNb) {
                this.fillRect(x, y, this.squareSize, this.squareSize, previousMoveColor)
            }
            if (highlightedSquareNbs[squareNb]) {
                this.fillRect(x, y, this.squareSize, this.squareSize, highlightedSquareColor)
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
            this.ctx.fillStyle = moveSquareColor
            this.ctx.fill()
        }
    }

    private squareNbToXY(squareNb: number): { x: number; y: number } {
        const displaySquareNb = this.squareNbToDisplaySquareNb(squareNb)
        return {
            x: this.squareSize * (displaySquareNb % 8),
            y: this.canvasDOM.height - this.squareSize - this.squareSize * Math.floor(displaySquareNb / 8),
        }
    }

    private getSquareColor(squareNb: number) {
        const displaySquareNb = this.squareNbToDisplaySquareNb(squareNb)
        return ((displaySquareNb >> 3) + displaySquareNb) % 2 === 0 ? 'dark' : 'light'
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

        const displaySquareNb =
            Math.floor(cssX / cssSquareSize) + Math.floor((cssSquareSize * 8 - (cssY + 1)) / cssSquareSize) * 8
        return this.displaySquareNbToSquareNb(displaySquareNb)
    }

    private drawCoordinates() {
        const fontSize = this.squareSize / 5
        this.ctx.font = `${fontSize}px Arial`

        for (let file = 0; file < 8; file++) {
            const displayFile = this.fileToDisplayFile(file)
            this.ctx.fillStyle =
                this.getSquareColor(this.squareNbToDisplaySquareNb(file)) === 'dark' ? lightSquares : darkSquares
            this.ctx.fillText(
                String.fromCharCode(97 + displayFile),
                this.squareSize * (file + 1) - fontSize,
                this.canvasDOM.height - fontSize * 0.4
            )
        }

        for (let rank = 0; rank < 8; rank++) {
            const displayRank = this.rankToDisplayRank(rank)
            this.ctx.fillStyle =
                this.getSquareColor(this.displaySquareNbToSquareNb(rank * 8)) === 'dark' ? lightSquares : darkSquares
            this.ctx.fillText(String(displayRank + 1), fontSize * 0.4, this.squareSize * (7 - rank) + fontSize * 1.2)
        }
    }

    private createBestMoveArrow(move: Move): void {
        const displayStartPosition = squareNbToFileRank(this.squareNbToDisplaySquareNb(move.startSquareNb))
        const displayEndPosition = squareNbToFileRank(this.squareNbToDisplaySquareNb(move.endSquareNb))
        const width = this.squareSize / 12

        const startCoordinates = {
            fromX: displayStartPosition.file * this.squareSize + this.squareSize / 2,
            fromY: (7 - displayStartPosition.rank) * this.squareSize + this.squareSize / 2,
        }
        const endCoordinates = {
            toX: displayEndPosition.file * this.squareSize + this.squareSize / 2,
            toY: (7 - displayEndPosition.rank) * this.squareSize + this.squareSize / 2,
        }

        drawArrow(startCoordinates, endCoordinates, width, bestMoveArrowColor, this.ctx)
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
const moveSquareColor = 'rgba(0, 0, 0, 0.15)'
const highlightedSquareColor = 'rgba(255, 70, 70, 0.75)'
const previousMoveColor = 'rgba(207, 155, 12, 0.5)'
const bestMoveArrowColor = 'rgba(50, 150, 50, 1)'