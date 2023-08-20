import { FileRank, Coordinates, PieceColor, AttackTable } from './types'

export function invertColor(color: PieceColor): PieceColor {
    return color === 'white' ? 'black' : 'white'
}

export function squareNbToFileRank(squareNb: number): FileRank {
    return {
        file: squareNb % 8,
        rank: Math.floor(squareNb / 8),
    }
}

export function fileRankToSquareNb({ file, rank }: FileRank): number {
    return rank * 8 + file
}

export function squareNbToCoordinates(squareNb: number): Coordinates {
    const { file, rank } = squareNbToFileRank(squareNb)
    const fileInLetter = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][file]
    return `${fileInLetter}${rank + 1}` as Coordinates
}

export function coordinatesToSquareNb(coordinates: Coordinates): number {
    const file = coordinates[0].charCodeAt(0) - 'a'.charCodeAt(0)
    const rank = Number(coordinates[1]) - 1
    return fileRankToSquareNb({ file, rank })
}

export function createEmptyAttackTable(): AttackTable {
    return { attackedSquares: new Array(64).fill(false), pinnedPieces: [] }
}
