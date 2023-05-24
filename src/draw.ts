import { Board } from './models/board'

const canvas = document.getElementById('board') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

function getSquareColors() {
    const lightSquares = '#f0d9b5'
    const darkSquares = '#b58863'
    const squareColors = []

    for (let i = 0; i < 64; i++) {
        let square = new Board().squares[i]
        let squareColor = ((i >> 3) + i) % 2 === 0 ? darkSquares : lightSquares
        //@ts-ignore
        squareColors.push(squareColor)
    }
    return squareColors
}

export function drawBoard() {
    const squareSize = 80

    canvas.height = squareSize * 8
    canvas.width = squareSize * 8

    for (let i = 0; i < 64; i++) {
        let squareColor = getSquareColors()[i]
        let y = canvas.height - squareSize - squareSize * Math.floor(i / 8)
        let x = squareSize * (i % 8)

        ctx.fillStyle = squareColor
        ctx.fillRect(x, y, squareSize, squareSize)
    }
    drawCoordinates(squareSize)
}

function drawCoordinates(interval = 80) {
    const fontSize = 18
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const numbers = ['8', '7', '6', '5', '4', '3', '2', '1']

    ctx.font = `${fontSize}px Arial`

    for (let i = 0; i < 8; i++) {
        ctx.fillStyle =
            i === 0 ? getSquareColors()[i + 1] : getSquareColors()[i - 1]
        ctx.fillText(
            letters[i],
            interval * (i + 1) - fontSize,
            canvas.height - fontSize * 0.4
        )
        ctx.fillStyle = i === 0 ? getSquareColors()[i] : getSquareColors()[i]
        ctx.fillText(numbers[i], fontSize * 0.4, interval * i + fontSize * 1.2)
    }
}
