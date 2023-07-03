import { fileRank, Coordinates } from './types'

export function squareNbTofilerank(squareNb: number): fileRank {
    return {
        file: squareNb % 8,
        rank: Math.floor(squareNb / 8),
    }
}

export function fileRankToSquareNb({ file, rank }: fileRank): number {
    return rank * 8 + file
}

export function squareNbToCoordinates(squareNb: number): Coordinates {
    const { file, rank } = squareNbTofilerank(squareNb)
    const fileInLetter = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][file]
    const coordinates: Coordinates = `${fileInLetter}${rank + 1}` as Coordinates
    console.log(squareNb + '=' + coordinates)
    return coordinates
}
