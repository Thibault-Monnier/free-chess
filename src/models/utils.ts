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
    return { attackedSquares: new Array(64).fill(false), pinnedPieces: [], kingAttackers: [] }
}

// Tests if a square is on the segment between two points
export function isBetweenSquares(squareNbFrom: number, testedSquareNb: number, squareNbTo: number): boolean {
    const fromSquare = squareNbToFileRank(squareNbFrom)
    const toSquare = squareNbToFileRank(squareNbTo)
    const squareTested = squareNbToFileRank(testedSquareNb)
    const direction = {
        file: Math.sign(toSquare.file - fromSquare.file),
        rank: Math.sign(toSquare.rank - fromSquare.rank),
    }

    let currentSquare = fromSquare
    currentSquare.file += direction.file
    currentSquare.rank += direction.rank
    while (currentSquare.file !== toSquare.file || currentSquare.rank !== toSquare.rank) {
        if (currentSquare.file < 0 || currentSquare.file > 7 || currentSquare.rank < 0 || currentSquare.rank > 7) {
            return false
        }
        if (currentSquare.file === squareTested.file && currentSquare.rank === squareTested.rank) return true

        currentSquare.file += direction.file
        currentSquare.rank += direction.rank
    }
    return false
}

export function calculateAxisOffset(squareNbFrom: number, squareNbTo: number): number {
    const fromSquare = squareNbToFileRank(squareNbFrom)
    const toSquare = squareNbToFileRank(squareNbTo)
    return fileRankToSquareNb({
        file: Math.sign(toSquare.file - fromSquare.file),
        rank: Math.sign(toSquare.rank - fromSquare.rank),
    })
}
