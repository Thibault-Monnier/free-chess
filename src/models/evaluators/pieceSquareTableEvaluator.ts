import { PieceColor } from '../types'
import { squareNbToFileRank } from '../utils'
import { Evaluator } from './evaluator'

//Coefficients from https://www.chessprogramming.org/Simplified_Evaluation_Function

export class PieceSquareTableEvaluator extends Evaluator {
    // private static const pawnValue

    run(): number {
        let evaluation = 0

        this.board.squares.forEach((piece, squareNb) => {
            switch (piece?.name) {
                case null:
                    return
                case 'pawn':
                    evaluation += this.pawnEvaluation(squareNb, piece.color)
                    return
                case 'knight':
                    evaluation += this.knightEvaluation(squareNb, piece.color)
                    return
                case 'bishop':
                    evaluation += this.bishopEvaluation(squareNb, piece.color)
                    return
                case 'rook':
                    evaluation += this.rookEvaluation(squareNb, piece.color)
                    return
                case 'queen':
                    evaluation += this.queenEvaluation(squareNb, piece.color)
                    return
                case 'king':
                    evaluation += this.kingEvaluation(squareNb, piece.color)
                    return
            }
        })

        return evaluation
    }

    private pieceEvaluation(squareNb: number, value: number, coefficients: number[][], color: PieceColor): number {
        const colorMultiplier = color === 'white' ? 1 : -1
        const { file, rank } = squareNbToFileRank(squareNb)
        const coefficient = coefficients[color === 'white' ? 7 - rank : rank][file]
        return (value + coefficient) * colorMultiplier
    }

    private pawnEvaluation(squareNb: number, color: PieceColor): number {
        const value = 100
        const coefficients = [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5, 5, 10, 25, 25, 10, 5, 5],
            [0, 0, 0, 20, 20, 0, 0, 0],
            [5, -5, -10, 0, 0, -10, -5, 5],
            [5, 10, 10, -20, -20, 10, 10, 5],
            [0, 0, 0, 0, 0, 0, 0, 0],
        ]
        return this.pieceEvaluation(squareNb, value, coefficients, color)
    }

    private knightEvaluation(squareNb: number, color: PieceColor): number {
        const value = 300
        const coefficients = [
            [-50, -40, -30, -30, -30, -30, -40, -50],
            [-40, -20, 0, 0, 0, 0, -20, -40],
            [-30, 0, 10, 15, 15, 10, 0, -30],
            [-30, 5, 15, 20, 20, 15, 5, -30],
            [-30, 0, 15, 20, 20, 15, 0, -30],
            [-30, 5, 10, 15, 15, 10, 5, -30],
            [-40, -20, 0, 5, 5, 0, -20, -40],
            [-50, -40, -30, -30, -30, -30, -40, -50],
        ]
        return this.pieceEvaluation(squareNb, value, coefficients, color)
    }

    private bishopEvaluation(squareNb: number, color: PieceColor): number {
        const value = 320
        const coefficients = [
            [-20, -10, -10, -10, -10, -10, -10, -20],
            [-10, 0, 0, 0, 0, 0, 0, -10],
            [-10, 0, 5, 10, 10, 5, 0, -10],
            [-10, 5, 5, 10, 10, 5, 5, -10],
            [-10, 0, 10, 10, 10, 10, 0, -10],
            [-10, 10, 10, 10, 10, 10, 10, -10],
            [-10, 5, 0, 0, 0, 0, 5, -10],
            [-20, -10, -10, -10, -10, -10, -10, -20],
        ]
        return this.pieceEvaluation(squareNb, value, coefficients, color)
    }

    private rookEvaluation(squareNb: number, color: PieceColor): number {
        const value = 500
        const coefficients = [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [5, 10, 10, 10, 10, 10, 10, 5],
            [-5, 0, 0, 0, 0, 0, 0, -5],
            [-5, 0, 0, 0, 0, 0, 0, -5],
            [-5, 0, 0, 0, 0, 0, 0, -5],
            [-5, 0, 0, 0, 0, 0, 0, -5],
            [-5, 0, 0, 0, 0, 0, 0, -5],
            [0, 0, 0, 5, 5, 0, 0, 0],
        ]
        return this.pieceEvaluation(squareNb, value, coefficients, color)
    }

    private queenEvaluation(squareNb: number, color: PieceColor): number {
        const value = 900
        const coefficients = [
            [-20, -10, -10, -5, -5, -10, -10, -20],
            [-10, 0, 0, 0, 0, 0, 0, -10],
            [-10, 0, 5, 5, 5, 5, 0, -10],
            [-5, 0, 5, 5, 5, 5, 0, -5],
            [0, 0, 5, 5, 5, 5, 0, -5],
            [-10, 5, 5, 5, 5, 5, 0, -10],
            [-10, 0, 5, 0, 0, 0, 0, -10],
            [-20, -10, -10, -5, -5, -10, -10, -20],
        ]
        return this.pieceEvaluation(squareNb, value, coefficients, color)
    }

    private kingEvaluation(squareNb: number, color: PieceColor): number {
        const value = 20000
        const coefficients = [
            [-30, -40, -40, -50, -50, -40, -40, -30],
            [-30, -40, -40, -50, -50, -40, -40, -30],
            [-30, -40, -40, -50, -50, -40, -40, -30],
            [-30, -40, -40, -50, -50, -40, -40, -30],
            [-20, -30, -30, -40, -40, -30, -30, -20],
            [-10, -20, -20, -20, -20, -20, -20, -10],
            [20, 20, 0, 0, 0, 0, 20, 20],
            [20, 30, 10, 0, 0, 10, 30, 20],
        ]
        return this.pieceEvaluation(squareNb, value, coefficients, color)
    }
}
