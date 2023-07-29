import { Board } from '../board'
import { PieceSquareTableEvaluator } from '../evaluators/pieceSquareTableEvaluator'
import { Move } from '../move'
import { BestMove } from '../types'
import { Bot } from './bot'

export class DepthNBot extends Bot {
    private nbEvaluations = 0

    run(): BestMove | null {
        this.nbEvaluations = 0
        const startTimestamp = performance.now()

        const moves = this.board.possibleMoves()
        const colorMultiplier = this.board.colorToMove === 'white' ? 1 : -1

        let bestMove: Move | null = null
        let bestEvaluation = -Infinity
        for (let move of moves) {
            const evaluation = this.minimax(move.endBoard, this.depth! - 1) * colorMultiplier

            if (evaluation > bestEvaluation) {
                bestMove = move
                bestEvaluation = evaluation
            }
        }

        const endTimestamp = performance.now()
        console.log(
            'Time:',
            Math.round(endTimestamp - startTimestamp),
            'ms' + ' - Evaluations:',
            this.nbEvaluations,
            ' - Evaluations/s:',
            Math.round((this.nbEvaluations / (endTimestamp - startTimestamp)) * 1000)
        )

        return bestMove ? { move: bestMove, evaluation: bestEvaluation } : null
    }

    private minimax(board: Board, depth: number): number {
        if (depth === 0 || board.endOfGame) {
            this.nbEvaluations++
            const evaluation = new PieceSquareTableEvaluator(board).run()
            return evaluation
        }

        const moves = board.possibleMoves()
        if (board.colorToMove === 'white') {
            let bestEvaluation = -Infinity
            for (let move of moves) {
                const evaluation = this.minimax(move.endBoard, depth - 1)
                bestEvaluation = Math.max(bestEvaluation, evaluation)
            }
            return bestEvaluation
        } else {
            let bestEvaluation = Infinity
            for (let move of moves) {
                const evaluation = this.minimax(move.endBoard, depth - 1)
                bestEvaluation = Math.min(bestEvaluation, evaluation)
            }
            return bestEvaluation
        }
    }
}
