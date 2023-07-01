import { fileRank, Coordinate } from './types'

export function squareNbTofilerank(squareNb: number): fileRank {
    return {
        file: squareNb % 8,
        rank: Math.floor(squareNb / 8),
    }
}

export function fileRankToSquareNb({ file, rank }: fileRank): number {
    return rank * 8 + file
}

export function squareNbToCoordinates(squareNb: number): void {
    const fileRank = squareNbTofilerank(squareNb)
}
