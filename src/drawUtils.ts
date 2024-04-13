import { PieceColor, PieceName } from './models/types'

export let imagesLoading = 0

// Free-chess unique pieces, no license
export const freeChessPiecesImages: Record<PieceColor, Record<PieceName, HTMLImageElement>> = {
    white: {
        pawn: stringToImage('src/assets/free-chess/white_pawn.svg'),
        rook: stringToImage('src/assets/free-chess/white_rook.svg'),
        knight: stringToImage('src/assets/free-chess/white_knight.svg'),
        bishop: stringToImage('src/assets/free-chess/white_bishop.svg'),
        queen: stringToImage('src/assets/free-chess/white_queen.svg'),
        king: stringToImage('src/assets/free-chess/white_king.svg'),
    },
    black: {
        pawn: stringToImage('src/assets/free-chess/black_pawn.svg'),
        rook: stringToImage('src/assets/free-chess/black_rook.svg'),
        knight: stringToImage('src/assets/free-chess/black_knight.svg'),
        bishop: stringToImage('src/assets/free-chess/black_bishop.svg'),
        queen: stringToImage('src/assets/free-chess/black_queen.svg'),
        king: stringToImage('src/assets/free-chess/black_king.svg'),
    },
}

// Lichess pieces https://github.com/lichess-org/lila/tree/master/public/piece/cburnett, license: https://creativecommons.org/licenses/by/3.0/
export const cburnettPiecesImages: Record<PieceColor, Record<PieceName, HTMLImageElement>> = {
    white: {
        pawn: stringToImage('src/assets/cburnett/wP.svg'),
        rook: stringToImage('src/assets/cburnett/wR.svg'),
        knight: stringToImage('src/assets/cburnett/wN.svg'),
        bishop: stringToImage('src/assets/cburnett/wB.svg'),
        queen: stringToImage('src/assets/cburnett/wQ.svg'),
        king: stringToImage('src/assets/cburnett/wK.svg'),
    },
    black: {
        pawn: stringToImage('src/assets/cburnett/bP.svg'),
        rook: stringToImage('src/assets/cburnett/bR.svg'),
        knight: stringToImage('src/assets/cburnett/bN.svg'),
        bishop: stringToImage('src/assets/cburnett/bB.svg'),
        queen: stringToImage('src/assets/cburnett/bQ.svg'),
        king: stringToImage('src/assets/cburnett/bK.svg'),
    },
}

function stringToImage(data: string): HTMLImageElement {
    const image = new Image()
    imagesLoading++
    image.onload = () => imagesLoading--
    image.src = data
    return image
}

export function drawArrow(
    { fromX, fromY }: { fromX: number; fromY: number },
    { toX, toY }: { toX: number; toY: number },
    width: number,
    color: string,
    ctx: CanvasRenderingContext2D
) {
    //variables to be used when creating the arrow
    var headlen = width * 2
    var angle = Math.atan2(toY - fromY, toX - fromX)

    ctx.strokeStyle = color

    //starting path of the arrow from the start square to the end square and drawing the stroke
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)
    ctx.lineWidth = width
    ctx.stroke()

    //starting a new path from the head of the arrow to one of the sides of the point
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7))

    //path from the side point of the arrow, to the other side point
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 7), toY - headlen * Math.sin(angle + Math.PI / 7))

    //path from the side point back to the tip of the arrow, and then again to the opposite side point
    ctx.lineTo(toX, toY)
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7))

    //draws the paths created above
    ctx.stroke()
}
