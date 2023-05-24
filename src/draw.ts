import { Board } from './models/board'

const canvas = document.getElementById('board') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const squareSize = 80
const lightSquares = '#f0d9b5'
const darkSquares = '#b58863'

export function initCanvas() {
    canvas.height = squareSize * 8
    canvas.width = squareSize * 8
}

export function drawBoard() {
    for (let squareNb = 0; squareNb < 64; squareNb++) {
        const y =
            canvas.height - squareSize - squareSize * Math.floor(squareNb / 8)
        const x = squareSize * (squareNb % 8)

        ctx.fillStyle =
            getSquareColor(squareNb) === 'dark' ? darkSquares : lightSquares
        ctx.fillRect(x, y, squareSize, squareSize)
    }
    drawCoordinates()
}

function getSquareColor(squareNb: number) {
    return ((squareNb >> 3) + squareNb) % 2 === 0 ? 'dark' : 'light'
}

function drawCoordinates() {
    const fontSize = 18
    ctx.font = `${fontSize}px Arial`

    for (let i = 0; i < 8; i++) {
        ctx.fillStyle =
            getSquareColor(i) === 'dark' ? lightSquares : darkSquares
        ctx.fillText(
            String.fromCharCode(97 + i),
            squareSize * (i + 1) - fontSize,
            canvas.height - fontSize * 0.4
        )
    }

    for (let i = 0; i < 8; i++) {
        ctx.fillStyle =
            getSquareColor(i * 8) === 'dark' ? lightSquares : darkSquares
        ctx.fillText(
            String(i + 1),
            fontSize * 0.4,
            squareSize * (7 - i) + fontSize * 1.2
        )
    }
}
