import { Board } from '../../Board'
import { PieceColor, PieceName } from '../../types'
import { squareNbToFileRank } from '../../utils'

// Coefficients from https://www.chessprogramming.org/Simplified_Evaluation_Function

export class Evaluator {
    constructor(public board: Board) {}

    updateBoard(board: Board) {
        this.board = board
    }

    run(): number {
        let evaluation = 0

        const { whiteMaterial, blackMaterial } = this.calculateMaterialWithoutPawns()
        const whiteEndgameWeight = this.getEndgameWeight(whiteMaterial)
        const blackEndgameWeight = this.getEndgameWeight(blackMaterial)

        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const piece = this.board.squares[squareNb]
            if (piece === null) continue
            evaluation += this.evaluatePiece(
                piece.name,
                squareNb,
                piece.color,
                piece.color == 'white' ? blackEndgameWeight : whiteEndgameWeight // Endgame depends on what the opponent has, not the player
            )
        }

        return evaluation
    }

    private getEndgameWeight(materialWithoutPawnsValue: number): number {
        const multiplier = 1 / endgameMaterialStart
        return 1 - Math.min(materialWithoutPawnsValue * multiplier, 1)
    }

    private calculateMaterialWithoutPawns(): { whiteMaterial: number; blackMaterial: number } {
        let whiteMaterial = 0
        let blackMaterial = 0

        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const piece = this.board.squares[squareNb]
            if (piece === null) continue

            let material = 0
            switch (piece.name) {
                case 'bishop':
                    material = bishopValue
                    break
                case 'knight':
                    material = knightValue
                    break
                case 'queen':
                    material = queenValue
                    break
                case 'rook':
                    material = rookValue
                    break
            }

            if (piece.color === 'white') {
                whiteMaterial += material
            } else {
                blackMaterial += material
            }
        }

        return { whiteMaterial, blackMaterial }
    }

    private evaluatePiece(pieceName: PieceName, squareNb: number, color: PieceColor, endgameWeight: number): number {
        const colorMultiplier = color === 'white' ? 1 : -1
        const value = this.getPieceValue(pieceName, squareNb, color, endgameWeight)

        return ~~value * colorMultiplier
    }

    private getPieceValue(pieceName: PieceName, squareNb: number, color: PieceColor, endgameWeight: number): number {
        const { file, rank } = squareNbToFileRank(squareNb)

        const rowIndex = color === 'white' ? 7 - rank : rank
        const fileIndex = color === 'white' ? file : 7 - file

        switch (pieceName) {
            case 'bishop':
                return bishopCoefficients[rowIndex][fileIndex] + bishopValue
            case 'knight':
                return knightCoefficients[rowIndex][fileIndex] + knightValue
            case 'queen':
                return queenCoefficients[rowIndex][fileIndex] + queenValue
            case 'rook':
                return rookCoefficients[rowIndex][fileIndex] + rookValue
            case 'king':
                const kingStart = kingStartCoefficients[rowIndex][fileIndex]
                const kingEnd = kingEndCoefficients[rowIndex][fileIndex]
                return kingStart * (1 - endgameWeight) + kingEnd * endgameWeight
            case 'pawn':
                const pawnStart = pawnStartCoefficients[rowIndex][fileIndex]
                const pawnEnd = pawnEndCoefficients[rowIndex][fileIndex]
                return pawnStart * (1 - endgameWeight) + pawnEnd * endgameWeight + pawnValue
        }
    }
}

const pawnValue = 100
const knightValue = 300
const bishopValue = 320
const rookValue = 500
const queenValue = 900

const endgameMaterialStart = 2 * rookValue + (3 / 2) * knightValue + bishopValue

const pawnStartCoefficients = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
]
const pawnEndCoefficients = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [80, 80, 80, 80, 80, 80, 80, 80],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [30, 30, 30, 30, 30, 30, 30, 30],
    [20, 20, 20, 20, 20, 20, 20, 20],
    [10, 10, 10, 10, 10, 10, 10, 10],
    [10, 10, 10, 10, 10, 10, 10, 10],
    [0, 0, 0, 0, 0, 0, 0, 0],
]

const knightCoefficients = [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
]

const bishopCoefficients = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
]

const rookCoefficients = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
]

const queenCoefficients = [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
]

const kingStartCoefficients = [
    [-80, -70, -70, -70, -70, -70, -70, -80],
    [-60, -60, -60, -60, -60, -60, -60, -60],
    [-40, -50, -50, -60, -60, -50, -50, -40],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, -5, -5, -5, -5, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
]
const kingEndCoefficients = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [-10, -5, 20, 30, 30, 20, -5, -10],
    [-15, -10, 35, 45, 45, 35, -10, -15],
    [-20, -15, 30, 40, 40, 30, -15, -20],
    [-25, -20, 20, 25, 25, 20, -20, -25],
    [-30, -25, 0, 0, 0, 0, -25, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
]
