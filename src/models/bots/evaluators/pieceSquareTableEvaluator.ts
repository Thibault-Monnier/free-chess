import { PieceColor, PieceName } from '../../types'
import { squareNbToFileRank } from '../../utils'
import { Evaluator } from './evaluator'

//Coefficients from https://www.chessprogramming.org/Simplified_Evaluation_Function

export class PieceSquareTableEvaluator extends Evaluator {
    run(): number {
        let evaluation = 0

        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const piece = this.board.squares[squareNb]
            if (piece === null) continue
            evaluation += this.pieceValue(piece.name, squareNb, piece.color)
        }

        return evaluation
    }

    private pieceEvaluation(squareNb: number, value: number, coefficients: number[][], color: PieceColor): number {
        const colorMultiplier = color === 'white' ? 1 : -1
        const { file, rank } = squareNbToFileRank(squareNb)
        const coefficient = coefficients[color === 'white' ? 7 - rank : rank][color === 'white' ? file : 7 - file]

        return (value + coefficient) * colorMultiplier
    }

    private pieceValue(pieceName: PieceName, squareNb: number, color: PieceColor): number {
        switch (pieceName) {
            case 'pawn':
                return this.pieceEvaluation(squareNb, pawnValue, pawnCoefficients, color)
            case 'knight':
                return this.pieceEvaluation(squareNb, knightValue, knightCoefficients, color)
            case 'bishop':
                return this.pieceEvaluation(squareNb, bishopValue, bishopCoefficients, color)
            case 'rook':
                return this.pieceEvaluation(squareNb, rookValue, rookCoefficients, color)
            case 'queen':
                return this.pieceEvaluation(squareNb, queenValue, queenCoefficients, color)
            case 'king':
                return this.pieceEvaluation(squareNb, kingValue, kingCoefficients, color)
        }
    }
}

const pawnValue = 100
const knightValue = 300
const bishopValue = 320
const rookValue = 500
const queenValue = 900
const kingValue = 20000
const pawnCoefficients = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
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
const kingCoefficients = [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
]
