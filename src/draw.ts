import { Board } from './models/board'

const canvas = document.getElementById('board') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const squareSize = 80
const lightSquares = '#f0d9b5'
const darkSquares = '#b58863'

const BLACK_BISHOP = new Image()
BLACK_BISHOP.src =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAARpSURBVGiB7Zo/bFtVFMZ/x7EhUdN2cFSkDMSCdEnKgkSH0IAZACkgAgpL2yhCDGz8UZNgRYINhpQgQAgQIwNiARRRJJOJAVhAuEhtBUIijhpRZJyAGpw4jRMfhmcjU/XZ78XnvbhuPunIkt/1ud/ne8699517RVW5lRDZawJhY19wu2NfcLtjTwSLSEJEBkUk9P5D7VBEhkXkZyALXATyIvJcmBxQ1VAMuB8oAXoDS4XFQ8LaeIjIRWDQ5XEJSKjqlaB5hBLSItKLu1iAGPBgGFzCyuHbPbTpDJwFIQlW1Szwe4Nm34XBJcxZ+qU6z95T1V/DIBGm4C+Bj3Fm5Vr8CMyGxiKE5agTOAP8wY2XJAWKwDtAb+B8AhZ7J3C+jtDr7W/g4ZtSMHACyPkQW7Vt4PmbSjDwLHBtF2Jr7UOgo+UFA48A5SbFVu31lhYM9ABXGgmZnZ3VdDqtkUikkeAdYLiVBc97GblsNquqqn19fV5GeQk4bMXRbB0WkceAUY9t//fZAH3AK7smdh2iVo6A024PRISpqSkGB533h56eHgDm5uYoFAqsr68zMzPD2tqam4uTIvKyVsKoKRiFchfwDy5hGY/HdXt7W+thbGysUWifsOBqNcKPAt1uD1dXV0kmk/T39wPOyMbjcaanp1lZWSGfz5NOpxv18TTwbdNMjUb4DD6Wm6WlJVVVTSQSfpaoL1pp0rrNT+OtrS0AyuVyYH24wSqkY34ap1IpBgYGWF5eDqwPVxiF9DPY7Kzq2UetFNLncDb9QWLewomJYFVdBb628OWCIrBg4ciy4nEW56UhCLypqhsmnizyoiaXp7HP3XNAxIyjpeCK6LNAaWhoSHO5nG5ubvqyjY0NnZycrIr9Cjhkyc9yL11FCjja2dn5ZDwep6Ojw9ePVZVoNAqwCJxSVdcN9m5gftQiIi8CbwNEo9Eqec8ol8v/bUyAeVV9ypSgcTjfjTOjWubwaUuO1nXpUeyPTE5aOjPN4fHx8dGRkREiEbv/MZPJPCQiola5ZxjOsYWFhS01RrFY1O7u7geseFqOcGxiYiKWTCa9lm48IZPJUCgUDlj5M52lRSSPU7m0xjFVvWThyHrS+tzYH8AlwO5k0So3KpESAV6gTn3Lh5WBDzDeaQVyx0NEDgKP49ShhnHC3EtirwEXgM+AT1XVV4XAE7fdChZnZuoFjuBUI2rtQOX7OyqfvTiHa0dc3G3gFOiywJ8VywFXcS681NpV4LKqlnbF26tgETkOPAHcC9wFJPB2dyMI7OBcoVgEfgLeVdVFT7/0kJeHgE8IvoTTjJWAV6kMYF09DcR2Ad+0gCCvlgbizQh+vwVE+LXzzey0Cg2e+8VvwA/A9zhL133AceAYdvv6Qr29d8NJS0ROAW/gzLwXgF+AyzWWw1lyokBHxQRnYqnaNpBT1b9c+ujCOSWs9VH9A2p97AAHK22rdhS4BzgMvAW8pqrXXPUEsQ7vBby+UbWNYK/YvxHf7tgX3O645QT/Cym/GLJbVZClAAAAAElFTkSuQmCC'

export function initCanvas() {
    canvas.height = squareSize * 8
    canvas.width = squareSize * 8
    canvas.setAttribute('style', '')
}

function squareNbToXY(squareNb: number): { x: number; y: number } {
    return {
        x: squareSize * (squareNb % 8),
        y: canvas.height - squareSize - squareSize * Math.floor(squareNb / 8),
    }
}

export function drawBoard() {
    for (let squareNb = 0; squareNb < 64; squareNb++) {
        const { x, y } = squareNbToXY(squareNb)
        ctx.fillStyle =
            getSquareColor(squareNb) === 'dark' ? darkSquares : lightSquares
        ctx.fillRect(x, y, squareSize, squareSize)
    }
    drawCoordinates()
    drawPieces()
}

function getSquareColor(squareNb: number) {
    return ((squareNb >> 3) + squareNb) % 2 === 0 ? 'dark' : 'light'
}

function drawCoordinates() {
    const fontSize = 14
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

function drawPieces() {
    ctx.drawImage(BLACK_BISHOP, 50, 50)
}
